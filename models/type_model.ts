export type AuthorModel = {
  asin: string;
  region: string;
  name: string;
  description: string | null;
  image: string | null;
  genres: GenreModel[] | null;
};

type SeriesModel = {
  asin: string;
  name: string;
  position: number | null;
  description: string | null;
};

export type SeriesInfoModel = {
  asin: string;
  title: string;
  description: string | undefined;
};

type NarratorModel = {
  name: string;
};

export type GenreModel = {
  asin: string;
  name: string;
  type: string;
};

type ChapterModel = {
  asin: string;
  chapters: {
    title: string;
    lengthMs: number;
    startOffsetMs: number;
    startOffsetSec: number;
  };
  isAccurate: boolean;
  runtimeLengthMs: number;
  runtimeLengthSec: number;
};

export type BookModel = {
  asin: string;
  title: string;
  subtitle: string | null;

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
};

export function mapBook(book: any): BookModel {
  return {
    asin: book.asin,
    regions: book.regions,
    title: book.title,
    subtitle: book.subtitle,

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
    series: book.series
      ? book.series.map(series => ({
          asin: series.series.asin,
          name: series.series.title,
          position: series.position,
          // description: series.series.description
        }))
      : null,
    authors: book.authors
      ? book.authors.map(bookToAuthor => ({
          asin: bookToAuthor.author.asin,
          region: bookToAuthor.author.region,
          name: bookToAuthor.author.name,
          // description: bookToAuthor.author.description
        }))
      : null,
    narrators: book.narrators
      ? book.narrators.map(narrator => ({
          name: narrator.name,
        }))
      : null,
    genres: book.genres
      ? book.genres.map(genre => ({
          asin: genre.asin,
          name: genre.name,
          type: genre.type,
        }))
      : null,
  };
}

export function mapChapter(chapter: any): ChapterModel {
  return {
    asin: chapter.bookAsin,
    chapters: chapter.content.chapters.map((chapter: any) => ({
      title: chapter.title,
      lengthMs: chapter.lengthMs,
      startOffsetMs: chapter.startOffsetMs,
      startOffsetSec: chapter.startOffsetSec,
    })),
    isAccurate: chapter.content.is_accurate,
    runtimeLengthMs: chapter.content.runtime_length_ms,
    runtimeLengthSec: chapter.content.runtime_length_sec,
  };
}

export function mapAuthors(author: any): AuthorModel {
  return {
    asin: author.asin,
    region: author.region,
    name: author.name,
    description: author.description,
    image: author.image,
    genres: author.genres
      ? author.genres.map(genre => ({
          asin: genre.genre.asin,
          name: genre.genre.name,
          type: genre.genre.type,
        }))
      : null,
  };
}
