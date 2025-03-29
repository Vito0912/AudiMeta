import { Book } from '@prisma/client';
import { logger, prisma } from '../app';
import { BookModel, mapBook } from '../models/type_model';

const bookInclude = {
  series: {
    include: {
      series: true,
    },
  },
  authors: {
    include: {
      author: true,
    },
  },
  narrators: true,
  genres: true,
};

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
  publisherName?: string;
  rating?: number;
  regions: string[];
  releaseDate?: Date;
  authorRegion: string;
  seriesBooks?: {
    seriesAsin: string;
    seriesTitle: string;
    seriesDescription?: string;
    position: string;
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
    if (product === undefined || product.title === undefined) {
      return undefined;
    }

    // Process series relationships if available
    const seriesBooks =
      product.relationships && Array.isArray(product.relationships)
        ? product.relationships
            .filter((rel: any) => rel.relationship_type === 'series')
            .map((rel: any) => ({
              seriesAsin: rel.asin,
              position: rel.sequence,
              seriesTitle: rel.title,
            }))
        : [];

    // Process genres from category ladders
    const genres: BookInput['genres'] = [];
    if (product.category_ladders && Array.isArray(product.category_ladders)) {
      product.category_ladders.forEach((cat: any) => {
        if (cat.ladder && Array.isArray(cat.ladder) && cat.ladder.length) {
          // First one is tag, all others are genres
          cat.ladder.forEach((genre: any, index: number) => {
            genres.push({
              asin: genre.id,
              name: genre.name,
              type: index === 0 ? 'Tags' : cat.root,
            });
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
      summary: product.publisher_summary,
      bookFormat: product.format_type,
      lengthMin: product.runtime_length_min,
      image: product.product_images ? product.product_images['500'] : undefined,
      explicit: false, // not provided explicitly in data
      isbn: product.isbn,
      language: product.language,
      publisherName: product.publisher_name,
      rating: product.rating && product.rating.overall_distribution ? Number(product.rating.overall_distribution.average_rating) : undefined,
      regions: [region],
      releaseDate: product.release_date ? new Date(product.release_date) : undefined,
      seriesBooks,
      authorRegion: region,
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
    logger.warn('Cannot insert book without an ASIN.');
    return;
  }

  const uniqueGenres = data.genres?.length
    ? Array.from(new Map(data.genres.map(g => [g.asin, g])).values())
    : [];
  const uniqueNarrators = data.narrators?.length
    ? Array.from(new Map(data.narrators.map(n => [n.name, n])).values())
    : [];
  const uniqueAuthors = data.authors?.length
    ? Array.from(new Map(data.authors.map(a => [`${a.asin || a.name}_${data.authorRegion}`, a])).values())
    : [];
  const uniqueSeriesBooks = data.seriesBooks?.length
    ? Array.from(new Map(data.seriesBooks.map(sb => [sb.seriesAsin, sb])).values())
    : [];


  const commonBookData = {
    title: data.title, subtitle: data.subtitle, copyRight: data.copyRight,
    description: data.description, summary: data.summary, bookFormat: data.bookFormat,
    lengthMin: data.lengthMin, image: data.image, explicit: data.explicit,
    isbn: data.isbn, language: data.language, publisherName: data.publisherName,
    rating: data.rating, regions: data.regions || [], releaseDate: data.releaseDate,
  };


  const seriesCreatePayload = uniqueSeriesBooks.length
    ? uniqueSeriesBooks.map(sb => ({
      position: sb.position,
      series: {
        connectOrCreate: {
          where: { asin: sb.seriesAsin },
          create: { asin: sb.seriesAsin, title: sb.seriesTitle, description: sb.seriesDescription },
        },
      },
    }))
    : undefined;

  const authorsCreatePayload = uniqueAuthors.length
    ? uniqueAuthors.map(author => {
      const authorAsin = author.asin || author.name;
      return {
        author: {
          connectOrCreate: {
            where: { asin_region: { asin: authorAsin, region: data.authorRegion } },
            create: { asin: authorAsin, region: data.authorRegion, name: author.name, description: author.description },
          },
        },
      };
    })
    : undefined;

  const narratorsCreatePayload = uniqueNarrators.length
    ? uniqueNarrators.map(narrator => ({
      narrator: {
        connectOrCreate: {
          where: { name: narrator.name },
          create: { name: narrator.name },
        },
      },
    }))
    : undefined;

  const genresCreatePayload = uniqueGenres.length
    ? uniqueGenres.map(genre => ({
      genre: {
        connectOrCreate: {
          where: { asin: genre.asin },
          create: { asin: genre.asin, name: genre.name, type: genre.type },
        },
      },
    }))
    : undefined;

  await prisma.book.upsert({
    where: { asin: data.asin },
    create: {
      asin: data.asin,
      ...commonBookData,
      series: seriesCreatePayload ? { create: seriesCreatePayload } : undefined,
      authors: authorsCreatePayload ? { create: authorsCreatePayload } : undefined,
      narrators: narratorsCreatePayload ? { create: narratorsCreatePayload } : undefined,
      genres: genresCreatePayload ? { create: genresCreatePayload } : undefined,
    },
    update: {
      ...commonBookData,
      series: seriesCreatePayload ? { deleteMany: {}, create: seriesCreatePayload } : { deleteMany: {} },
      authors: authorsCreatePayload ? { deleteMany: {}, create: authorsCreatePayload } : { deleteMany: {} },
      narrators: narratorsCreatePayload ? { deleteMany: {}, create: narratorsCreatePayload } : { deleteMany: {} },
      genres: genresCreatePayload ? { deleteMany: {}, create: genresCreatePayload } : { deleteMany: {} },
    },
  });
}

/**
 * Inserts multiple books into the database efficiently using bulk operations.
 * @param data Array of book data to insert.
 */
export async function insertBooks(data: BookInput[]) {
  if (!data || data.length === 0) {
    return { insertedBooks: 0, message: 'No data provided.' };
  }

  const defaultAuthorRegion = data[0]?.authorRegion;
  if (!defaultAuthorRegion) {
    console.warn("No authorRegion found in the first book input. Skipping author creation/linking.");
  }

  const inputAsins = data.map(b => b.asin).filter((asin): asin is string => !!asin);
  if (inputAsins.length === 0) {
    return { insertedBooks: 0, message: 'No valid ASINs found in input.' };
  }

  const existingBooks = await prisma.book.findMany({
    where: { asin: { in: inputAsins } },
    select: { asin: true },
  });
  const existingAsins = new Set(existingBooks.map(b => b.asin));
  const newBooksInput = data.filter(b => b.asin && !existingAsins.has(b.asin));

  if (newBooksInput.length === 0) {
    return { insertedBooks: 0, message: 'All books in the batch already exist.' };
  }

  const bookRecords: any[] = [];
  const seriesMap = new Map<string, { asin: string; title: string; description?: string }>();
  const seriesBookRecords: { seriesAsin: string; bookAsin: string; position: string }[] = [];
  const authorMap = new Map<string, { asin: string; region: string; name: string; description?: string }>();
  const bookAuthorRecords: { bookAsin: string; authorAsin: string; authorRegion: string }[] = [];
  const narratorMap = new Map<string, { name: string }>();
  const bookNarratorConnections: { bookAsin: string; narratorName: string }[] = [];
  const genreMap = new Map<string, { asin: string; name: string; type: string }>();
  const bookGenreRecords: { bookAsin: string; genreAsin: string }[] = [];

  for (const b of newBooksInput) {
    if (!b.asin) continue;

    bookRecords.push({
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
    });

    if (b.seriesBooks) {
      b.seriesBooks.forEach(sb => {
        if (sb.seriesAsin && b.asin) {
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
        }
      });
    }

    if (b.authors && defaultAuthorRegion) {
      b.authors.forEach(author => {
        const authorKey = author.asin ? `${author.asin}_${defaultAuthorRegion}` : `${author.name}_${defaultAuthorRegion}`;
        const authorAsin = author.asin || author.name;

        if (authorAsin && b.asin) {
          if (!authorMap.has(authorKey)) {
            authorMap.set(authorKey, {
              asin: authorAsin,
              region: defaultAuthorRegion,
              name: author.name,
              description: author.description,
            });
          }
          bookAuthorRecords.push({
            bookAsin: b.asin,
            authorAsin: authorAsin,
            authorRegion: defaultAuthorRegion,
          });
        }
      });
    }

    if (b.narrators) {
      b.narrators.forEach(narrator => {
        if (narrator.name && b.asin) {
          if (!narratorMap.has(narrator.name)) {
            narratorMap.set(narrator.name, { name: narrator.name });
          }
          bookNarratorConnections.push({
            bookAsin: b.asin,
            narratorName: narrator.name,
          });
        }
      });
    }

    if (b.genres) {
      b.genres.forEach(genre => {
        if (genre.asin && genre.name && b.asin) {
          if (!genreMap.has(genre.asin)) {
            genreMap.set(genre.asin, {
              asin: genre.asin,
              name: genre.name,
              type: genre.type,
            });
          }
          bookGenreRecords.push({
            bookAsin: b.asin,
            genreAsin: genre.asin,
          });
        }
      });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (bookRecords.length > 0) {
        logger.info(`Creating ${bookRecords.length} book records...`);
        await tx.book.createMany({
          data: bookRecords,
          skipDuplicates: true,
        });
      }

      const seriesRecords = Array.from(seriesMap.values());
      if (seriesRecords.length > 0) {
        logger.info(`Creating ${seriesRecords.length} series records...`);
        await tx.series.createMany({
          data: seriesRecords,
          skipDuplicates: true,
        });
      }
      if (seriesBookRecords.length > 0) {
        logger.info(`Creating ${seriesBookRecords.length} series-book relations...`);
        await tx.seriesBook.createMany({
          data: seriesBookRecords,
          skipDuplicates: true,
        });
      }

      const authorRecords = Array.from(authorMap.values());
      if (authorRecords.length > 0) {
        logger.info(`Creating ${authorRecords.length} author records...`);
        await tx.author.createMany({
          data: authorRecords,
          skipDuplicates: true,
        });
      }
      if (bookAuthorRecords.length > 0) {
        logger.info(`Creating ${bookAuthorRecords.length} book-author relations...`);
        await tx.bookAuthor.createMany({
          data: bookAuthorRecords,
          skipDuplicates: true,
        });
      }

      const narratorRecords = Array.from(narratorMap.values());
      let narratorNameToIdMap = new Map<string, number>();
      if (narratorRecords.length > 0) {
        logger.info(`Creating ${narratorRecords.length} narrator records...`);
        await tx.narrator.createMany({
          data: narratorRecords,
          skipDuplicates: true,
        });

        logger.info(`Fetching IDs for ${narratorMap.size} narrators...`);
        const narratorNames = Array.from(narratorMap.keys());
        const narratorsWithIds = await tx.narrator.findMany({
          where: { name: { in: narratorNames } },
          select: { id: true, name: true },
        });
        narratorNameToIdMap = new Map(narratorsWithIds.map(n => [n.name, n.id]));
      }

      const bookNarratorRecords: { bookAsin: string; narratorId: number }[] = [];
      if (bookNarratorConnections.length > 0) {
        bookNarratorConnections.forEach(conn => {
          const narratorId = narratorNameToIdMap.get(conn.narratorName);
          if (narratorId) {
            bookNarratorRecords.push({
              bookAsin: conn.bookAsin,
              narratorId: narratorId,
            });
          } else {
            logger.warn(`Could not find ID for narrator: ${conn.narratorName}. Skipping connection for book ${conn.bookAsin}.`);
          }
        });

        if (bookNarratorRecords.length > 0) {
          logger.info(`Creating ${bookNarratorRecords.length} book-narrator relations...`);
          await tx.bookNarrator.createMany({
            data: bookNarratorRecords,
            skipDuplicates: true,
          });
        }
      }

      const genreRecords = Array.from(genreMap.values());
      if (genreRecords.length > 0) {
        logger.info(`Creating ${genreRecords.length} genre records...`);
        await tx.genre.createMany({
          data: genreRecords,
          skipDuplicates: true,
        });
      }
      if (bookGenreRecords.length > 0) {
        logger.info(`Creating ${bookGenreRecords.length} book-genre relations...`);
        await tx.bookGenre.createMany({
          data: bookGenreRecords,
          skipDuplicates: true,
        });
      }
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return { insertedBooks: newBooksInput.length };

  } catch (error) {
    logger.error("Error during bulk book insertion transaction:", error);
    throw new Error(`Failed to insert books: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Returns all books that match the asin and caches them in the database
 */
export async function getFullBooks(asins: string[] | string, region: string | undefined): Promise<BookModel[] | BookModel | null> {
  const asinsArray = Array.isArray(asins) ? asins : [asins];
  const books = await prisma.book.findMany({
    where: {
      asin: { in: asinsArray },
      // ...(region !== undefined ? {has: region.toUpperCase()} : undefined)
    },
    include: bookInclude,
  });

  if (!books) {
    return null;
  }

  if (Array.isArray(asins)) {
    return books.map(book => mapBook(book));
  }
  if (books.length === 0) {
    return null;
  }
  return mapBook(books[0]);
}

/**
 * Returns books from other regions based on title (subtitle or description) and author
 *
 * @param title - Title of the book
 * @param author - Author of the book
 */
export async function getBooksFromOtherRegions(title: string, author: string, limit?: number, page?: number): Promise<BookModel[] | undefined> {
  const authorFilter = author
    ? {
        authors: {
          some: {
            author: {
              name: author,
            },
          },
        },
      }
    : undefined;

  const titleFilter = title
    ? {
        OR: [
          { subtitle: { contains: title, mode: 'insensitive' } },
          { title: { contains: title, mode: 'insensitive' } },
          { summary: { contains: title, mode: 'insensitive' } },
        ],
      }
    : undefined;

  if (!titleFilter && !authorFilter) {
    throw new Error('Title or author must be provided');
  }

  const books = await prisma.book.findMany({
    where: {
      AND: [
        // @ts-ignore
        ...[titleFilter ?? {}],
        ...[authorFilter ?? {}],
      ],
    },
    include: bookInclude,
    ...(limit ? { take: limit } : {}),
    ...(page ? { skip: page * limit } : {}),
  });

  if (!books || books.length === 0) {
    return [];
  }

  return books.map(book => mapBook(book));
}

export async function getBooksFromAuthor(authorAsin: string, region: string, limit: number, offset: number): Promise<BookModel[] | undefined> {
  const books = await prisma.book.findMany({
    where: {
      authors: {
        some: {
          authorAsin: authorAsin,
        },
      },
    },
    take: limit,
    skip: offset,
    include: bookInclude,
  });

  if (!books) {
    return undefined;
  }

  return books.map(book => mapBook(book));
}

export async function selectLocalBooks(
  inputs: {
    localTitle: string;
    localAuthor: string;
    localNarrator: string;
    localGenre: string;
    localSeries: string;
    localSeriesPosition: string;
    localIsbn: string;
  },
  limit: number | undefined,
  page: number | undefined
): Promise<BookModel[] | undefined> {
  const conditions = [];

  if (inputs.localTitle) {
    conditions.push({
      OR: [
        {
          title: {
            contains: inputs.localTitle,
            mode: 'insensitive',
          },
        },
        {
          subtitle: {
            contains: inputs.localTitle,
            mode: 'insensitive',
          },
        },
      ],
    });
  }

  if (inputs.localAuthor) {
    conditions.push({
      authors: {
        some: {
          author: {
            name: {
              contains: inputs.localAuthor,
              mode: 'insensitive',
            },
          },
        },
      },
    });
  }

  if (inputs.localNarrator) {
    conditions.push({
      narrators: {
        some: {
          name: {
            contains: inputs.localNarrator,
            mode: 'insensitive',
          },
        },
      },
    });
  }

  if (inputs.localGenre) {
    conditions.push({
      genres: {
        some: {
          name: {
            contains: inputs.localGenre,
            mode: 'insensitive',
          },
        },
      },
    });
  }

  if (inputs.localSeries) {
    const seriesCondition: any = {
      series: {
        some: {
          series: {
            title: {
              contains: inputs.localSeries,
              mode: 'insensitive',
            },
          },
        },
      },
    };

    if (inputs.localSeriesPosition) {
      seriesCondition.series.some.position = parseInt(inputs.localSeriesPosition);
    }

    conditions.push(seriesCondition);
  }

  if (inputs.localIsbn) {
    conditions.push({
      isbn: {
        contains: inputs.localIsbn,
        mode: 'insensitive',
      },
    });
  }

  if (conditions.length === 0) {
    return undefined;
  }

  const whereClause = conditions.length > 0 ? { OR: conditions } : {};

  const paginationOptions = {};
  if (limit === undefined) limit = 10;
  paginationOptions['take'] = limit;

  if (page !== undefined) {
    paginationOptions['skip'] = (page - 1) * limit;
  }

  const books = await prisma.book.findMany({
    where: whereClause,
    include: bookInclude,
    ...paginationOptions,
  });

  if (!books) {
    return undefined;
  }

  return books.map(book => mapBook(book));
}
