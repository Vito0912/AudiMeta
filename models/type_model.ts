type AuthorModel = {
    asin: string;
    region: string;
    name: string;
    description: string | null;
}

type SeriesModel = {
    asin: string;
    name: string;
    position: number | null;
    description: string | null;
}

type NarratorModel = {
    name: string;
}

type GenreModel = {
    asin: string;
    name: string;
    type: string;
}

type ChapterModel = {
    asin: string;
    chapters: {
        title: string;
        lengthMs: number;
        startOffsetMs: number;
        startOffsetSec: number;
    }
    isAccurate: boolean;
    runtimeLengthMs: number;
    runtimeLengthSec: number;
}

export type BookModel = {
    asin: string;
    title: string;

    copyright: string | null;
    description: string | null;
    summary: string | null;
    bookFormat: string | null;
    lengthMinutes: number | null;

    imageUrl: string | null;
    explicit: boolean | null;
    isbn: string | null;
    language: string | null;
    publisher: string | null;

    rating: number | null;
    regions: string[];

    series: SeriesModel[] | null;
    authors: AuthorModel[] | null;
    narrators: NarratorModel[] | null;
    genres: GenreModel[] | null;

    releaseDate: Date | null;
}

export function mapBook(book: any): BookModel {
    return {
        asin: book.asin,
        regions: book.regions,
        title: book.title,

        copyright: book.copyRight,
        description: book.description,
        summary: book.summary,
        bookFormat: book.bookFormat,
        lengthMinutes: book.lengthMin,

        imageUrl: book.image,
        explicit: book.explicit,
        isbn: book.isbn,
        language: book.language,
        publisher: book.publisherName,
        releaseDate: book.releaseDate,

        rating: book.rating,
        series: book.series.map(series => ({
            asin: series.series.asin,
            name: series.series.title,
            position: series.position,
            description: series.series.description
        })),
        authors: book.authors.map(bookToAuthor => ({
            asin: bookToAuthor.author.asin,
            region: bookToAuthor.author.region,
            name: bookToAuthor.author.name,
            description: bookToAuthor.author.description
        })),
        narrators: book.narrators.map(narrator => ({
            name: narrator.name
        })),
        genres: book.genres.map(genre => ({
            asin: genre.asin,
            name: genre.name,
            type: genre.type
        }))
    };
}