import {Book} from "@prisma/client";
import {prisma} from "../app";

export type BookInput = {
    asin: string;
    title: string;
    subtitle?: string;
    copyRight?: string;
    description?: string;
    summary?: string;
    bookFormat?: string;
    lengthMin?: number;
    image?: string;
    explicit?: boolean;
    isbn?: string;
    language?: string;
    publisherName: string;
    rating?: number;
    regions?: string[];
    releaseDate?: Date;

    seriesBooks?: {
        seriesAsin: string;
        seriesTitle: string;
        seriesDescription?: string;
        position: number;
    }[];
    authors?: {
        asin: string;
        name: string;
        description?: string;
    }[];
    narrators?: {
        name: string;
    }[];
    genres?: {
        asin: string;
        name: string;
        type: string;
    }[];
};

export class BookInputFactory {
    static fromAudibleDate(product: any, region: string): BookInput {
        if(product === undefined || product.title === undefined) {
            return undefined;
        }

        // Process series relationships if available
        const seriesBooks =
            product.relationships && Array.isArray(product.relationships)
                ? product.relationships
                    .filter((rel: any) => rel.relationship_type === "series")
                    .map((rel: any) => ({
                        seriesAsin: rel.asin,
                        position: Number(rel.sequence) || 0,
                        seriesTitle: rel.title,
                    }))
                : [];

        // Process genres from category ladders
        const genres: BookInput["genres"] = [];
        if (product.category_ladders && Array.isArray(product.category_ladders)) {
            product.category_ladders.forEach((cat: any) => {
                if (cat.ladder && Array.isArray(cat.ladder) && cat.ladder.length) {
                    const last = cat.ladder[cat.ladder.length - 1];
                    genres.push({
                        asin: last.id,
                        name: last.name,
                        type: cat.root,
                    });
                }
            });
        }

        return {
            asin: product.asin,
            title: product.title,
            subtitle: product.subtitle,
            copyRight: product.copyright,
            description: product.extended_product_description,
            summary: product.merchandising_summary,
            bookFormat: product.format_type,
            lengthMin: product.runtime_length_min,
            image: product.product_images ? product.product_images["500"] : undefined,
            explicit: false, // not provided explicitly in data
            isbn: product.isbn,
            language: product.language,
            publisherName: product.publisher_name,
            rating:
                product.rating && product.rating.overall_distribution
                    ? Number(product.rating.overall_distribution.average_rating)
                    : undefined,
            regions: [region],
            releaseDate: product.release_date ? new Date(product.release_date) : undefined,
            seriesBooks,
            authors: product.authors,
            narrators: product.narrators,
            genres,
        };
    }
}

/**
 * Inserts a book into the database.
 * @param data
 */
export async function insertBook(data: BookInput) {
    if (!data.asin) {
        console.log("No asin provided");
    }

    await prisma.book.upsert({
        where: { asin: data.asin },
        create: {
            asin: data.asin,
            title: data.title,
            subtitle: data.subtitle,
            copyRight: data.copyRight,
            description: data.description,
            summary: data.summary,
            bookFormat: data.bookFormat,
            lengthMin: data.lengthMin,
            image: data.image,
            explicit: data.explicit,
            isbn: data.isbn,
            language: data.language,
            publisherName: data.publisherName,
            rating: data.rating,
            regions: data.regions || [],
            releaseDate: data.releaseDate,
            series: data.seriesBooks?.length
                ? {
                    create: data.seriesBooks.map((sb) => ({
                        position: sb.position,
                        series: {
                            connectOrCreate: {
                                where: { asin: sb.seriesAsin },
                                create: {
                                    asin: sb.seriesAsin,
                                    title: sb.seriesTitle,
                                    description: sb.seriesDescription,
                                },
                            },
                        },
                    })),
                }
                : undefined,
            authors: data.authors?.length
                ? {
                    connectOrCreate: data.authors.map((author) => {
                        if (!author.asin) {
                            author.asin = author.name;
                        }
                        return {
                            where: { asin: author.asin },
                            create: {
                                asin: author.asin,
                                name: author.name,
                                description: author.description,
                            },
                        };
                    }),
                }
                : undefined,
            narrators: data.narrators?.length
                ? {
                    connectOrCreate: data.narrators.map((narrator) => ({
                        where: { name: narrator.name },
                        create: { name: narrator.name },
                    })),
                }
                : undefined,
            genres: data.genres?.length
                ? {
                    connectOrCreate: data.genres.map((genre) => ({
                        where: { asin: genre.asin },
                        create: {
                            asin: genre.asin,
                            name: genre.name,
                            type: genre.type,
                        },
                    })),
                }
                : undefined,
        },
        update: {
            title: data.title,
            subtitle: data.subtitle,
            copyRight: data.copyRight,
            description: data.description,
            summary: data.summary,
            bookFormat: data.bookFormat,
            lengthMin: data.lengthMin,
            image: data.image,
            explicit: data.explicit,
            isbn: data.isbn,
            language: data.language,
            publisherName: data.publisherName,
            rating: data.rating,
            regions: data.regions || [],
            releaseDate: data.releaseDate,
        },
    });
}

/**
 * Inserts multiple books into the database.
 * TODO: Optimize this function to reduce the number of DB requests.
 * @param data
 */
export async function insertBooks(data: BookInput[]) {
    // Helper to process items in batches to limit concurrent DB requests.
    async function processInBatches<T>(
        items: T[],
        batchSize: number,
        callback: (item: T) => Promise<any>
    ) {
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(batch.map(callback));
        }
    }

    // 1. Filter out books that already exist.
    const inputAsins = data.map((b) => b.asin).filter(Boolean);
    const existingBooks = await prisma.book.findMany({
        where: { asin: { in: inputAsins } },
        select: { asin: true },
    });
    const existingAsins = new Set(existingBooks.map((b) => b.asin));
    const newBooks = data.filter((b) => b.asin && !existingAsins.has(b.asin));

    // 2. Prepare records for bulk creation of books (only scalar fields; nested relations will be processed separately).
    const bookRecords = newBooks.map((b) => ({
        asin: b.asin,
        title: b.title,
        subtitle: b.subtitle,
        copyRight: b.copyRight,
        description: b.description,
        summary: b.summary,
        bookFormat: b.bookFormat,
        lengthMin: b.lengthMin,
        image: b.image,
        explicit: b.explicit,
        isbn: b.isbn,
        language: b.language,
        publisherName: b.publisherName,
        rating: b.rating,
        regions: b.regions || [],
        releaseDate: b.releaseDate,
    }));

    if (bookRecords.length > 0) {
        await prisma.book.createMany({ data: bookRecords });
    }

    // 3. Process Series & SeriesBook relations.
    const seriesMap = new Map<string, { asin: string; title: string; description?: string }>();
    const seriesBookRecords: Array<{ seriesAsin: string; bookAsin: string; position: number }> = [];
    newBooks.forEach((b) => {
        if (b.seriesBooks && b.seriesBooks.length) {
            b.seriesBooks.forEach((sb) => {
                seriesBookRecords.push({
                    seriesAsin: sb.seriesAsin,
                    bookAsin: b.asin,
                    position: sb.position,
                });
                if (!seriesMap.has(sb.seriesAsin)) {
                    seriesMap.set(sb.seriesAsin, {
                        asin: sb.seriesAsin,
                        title: sb.seriesTitle,
                        description: sb.seriesDescription,
                    });
                }
            });
        }
    });
    if (seriesMap.size > 0) {
        const seriesRecords = Array.from(seriesMap.values());
        await prisma.series.createMany({ data: seriesRecords, skipDuplicates: true });
        if (seriesBookRecords.length > 0) {
            await prisma.seriesBook.createMany({ data: seriesBookRecords });
        }
    }

    // 4. Process Authors and connect them to books.
    const authorMap = new Map<string, { asin: string; name: string; description?: string }>();
    const bookAuthorConnections: Array<{ bookAsin: string; authorAsin: string }> = [];
    newBooks.forEach((b) => {
        if (b.authors && b.authors.length) {
            b.authors.forEach((author) => {
                const authorAsin = author.asin || author.name;
                if (!authorMap.has(authorAsin)) {
                    authorMap.set(authorAsin, {
                        asin: authorAsin,
                        name: author.name,
                        description: author.description,
                    });
                }
                bookAuthorConnections.push({
                    bookAsin: b.asin,
                    authorAsin,
                });
            });
        }
    });
    if (authorMap.size > 0) {
        const authorRecords = Array.from(authorMap.values());
        await prisma.author.createMany({ data: authorRecords, skipDuplicates: true });

        // Connect authors to books in controlled batches.
        await processInBatches(
            bookAuthorConnections,
            10, // Adjust concurrency here as needed.
            async (rel) =>
                prisma.book.update({
                    where: { asin: rel.bookAsin },
                    data: { authors: { connect: { asin: rel.authorAsin } } },
                })
        );
    }

    // 5. Process Narrators and connect them to books.
    const narratorMap = new Map<string, { name: string }>();
    const bookNarratorConnections: Array<{ bookAsin: string; narratorName: string }> = [];
    newBooks.forEach((b) => {
        if (b.narrators && b.narrators.length) {
            b.narrators.forEach((narrator) => {
                if (!narratorMap.has(narrator.name)) {
                    narratorMap.set(narrator.name, { name: narrator.name });
                }
                bookNarratorConnections.push({
                    bookAsin: b.asin,
                    narratorName: narrator.name,
                });
            });
        }
    });
    if (narratorMap.size > 0) {
        const narratorRecords = Array.from(narratorMap.values());
        await prisma.narrator.createMany({ data: narratorRecords, skipDuplicates: true });
        await processInBatches(
            bookNarratorConnections,
            10,
            async (rel) =>
                prisma.book.update({
                    where: { asin: rel.bookAsin },
                    data: { narrators: { connect: { name: rel.narratorName } } },
                })
        );
    }

    // 6. Process Genres and connect them to books.
    const genreMap = new Map<string, { asin: string; name: string; type: string }>();
    const bookGenreConnections: Array<{ bookAsin: string; genreAsin: string }> = [];
    newBooks.forEach((b) => {
        if (b.genres && b.genres.length) {
            b.genres.forEach((genre) => {
                if (!genreMap.has(genre.asin)) {
                    genreMap.set(genre.asin, {
                        asin: genre.asin,
                        name: genre.name,
                        type: genre.type,
                    });
                }
                bookGenreConnections.push({
                    bookAsin: b.asin,
                    genreAsin: genre.asin,
                });
            });
        }
    });
    if (genreMap.size > 0) {
        const genreRecords = Array.from(genreMap.values());
        await prisma.genre.createMany({ data: genreRecords, skipDuplicates: true });
        await processInBatches(
            bookGenreConnections,
            10,
            async (rel) =>
                prisma.book.update({
                    where: { asin: rel.bookAsin },
                    data: { genres: { connect: { asin: rel.genreAsin } } },
                })
        );
    }

    return { insertedBooks: newBooks.length };
}


/**
 * Returns a book based on the asin
 * @param asin
 * @param region
 */
export async function getFullBook(asin: string, region: string): Promise<Book | null> {
    return prisma.book.findFirst({
        where: {asin: asin
            //, regions: {has: region.toUpperCase()}
            },
        include: {
            series: {
                include: {
                    series: true,
                },
            },
            authors: true,
            narrators: true,
            genres: true,
        },
    });
}

/**
 * Returns all books that match the asin and caches them in the database
 */
export async function getFullBooks(asins: string[], region: string): Promise<Book[] | null> {
    return prisma.book.findMany({
        where: {asin: {in: asins}
            //, regions: {has: region.toUpperCase()}
        },
        include: {
            series: {
                include: {
                    series: true,
                },
            },
            authors: true,
            narrators: true,
            genres: true,
        },
    });
}

/**
 * Returns books from other regions based on title (subtitle or description) and author
 *
 * @param title - Title of the book
 * @param author - Author of the book
 */
export async function getBooksFromOtherRegions(title: string, author: string) {
    const authorFilter = author ? { authors: { some: { name: author } } } : undefined;

    const titleFilter = title ? {
        OR: [
            {subtitle: {contains: title, mode: "insensitive"}},
            {title: {contains: title, mode: "insensitive"}},
            {summary: {contains: title, mode: "insensitive"}},
        ],
    } : undefined;

    if(!titleFilter && !authorFilter) {
        throw new Error("Title or author must be provided");
    }

    return prisma.book.findMany({
        where: {
            AND: [
                // @ts-ignore
                ...[titleFilter ?? {}],
                ...[authorFilter ?? {}],
            ]
        },
        include: {
            series: {
                include: {
                    series: true
                }
            },
            authors: true,
            narrators: true,
            genres: true
        }
    });
}
