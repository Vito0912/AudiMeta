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

export async function insertBook(data: BookInput): Promise<Book> {
    if (!data.asin) throw new Error("ASIN is required to insert a book");
    return prisma.book.upsert({
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
            series:
                data.seriesBooks?.length
                    ? {
                        create: data.seriesBooks.map((sb) => ({
                            position: sb.position,
                            series: {
                                connectOrCreate: {
                                    where: { asin: sb.seriesAsin },
                                    create: {
                                        asin: sb.seriesAsin,
                                        // Assumes that series title and description are provided as part of the seriesBooks input.
                                        // Replace the following with appropriate default values or optional chaining if needed.
                                        title: sb.seriesTitle,
                                        description: sb.seriesDescription,
                                    },
                                },
                            },
                        })),
                    }
                    : undefined,
            authors:
                data.authors?.length
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
            narrators:
                data.narrators?.length
                    ? {
                        connectOrCreate: data.narrators.map((narrator) => ({
                            where: { name: narrator.name },
                            create: { name: narrator.name },
                        })),
                    }
                    : undefined,
            genres:
                data.genres?.length
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
        update: {},
    });
}


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

export async function getBooksFromOtherRegions(title: string, author: string) {
    const authorFilter = author ? { authors: { some: { name: author } } } : undefined;

    return prisma.book.findMany({
        where: {
            AND: [
                {
                    OR: [
                        {subtitle: {contains: title, mode: "insensitive"}},
                        {title: {contains: title, mode: "insensitive"}},
                        {summary: {contains: title, mode: "insensitive"}},
                    ],
                },
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
