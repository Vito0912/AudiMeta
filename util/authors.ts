import { AuthorModel, BookModel, GenreModel, mapAuthors } from '../models/type_model';
import { HEADERS, prisma, regionMap } from '../app';
import axios from 'axios';
import parse from 'node-html-parser';
import { generateScrapingHeaders } from './audible_scraping';
import { generateSearchKey } from './searchCache';
import { getBooks } from './bookDB';
import { getBooksFromOtherRegions } from './book';

export async function getAuthorDetails(asin: string, region: string): Promise<AuthorModel | undefined> {
  const URL = `https://audible${regionMap[region]}/author/${asin}?ipRedirectOverride=true&overrideBaseCountry=true`;

  try {
    const response = await axios.get(URL, {
      headers: generateScrapingHeaders(region),
    });

    if (response.status === 200 || response.status === 301) {
      if (response.request.path.includes('ipRedirectOriginalURL=404') || response.request.path.includes('advsearchKeywords')) {
        return undefined;
      }

      const htmlContent = response.data;
      const html = parse(htmlContent);

      let seriesInfoHtml: string = '';

      // Div with bc-expander-content
      const seriesInfo = html.querySelector('.bc-expander-content');
      if (seriesInfo) {
        const p = seriesInfo.querySelector('p') || seriesInfo.querySelector('span') || seriesInfo.querySelector('div');
        const innerHtml = p.innerHTML;

        seriesInfoHtml = innerHtml.toString();

        // Minimize the seriesInfoHtml (Strip chunks of whitespace)
        seriesInfoHtml = seriesInfoHtml.replace(/\s{2,}/g, ' ');
      }

      // Select title by h1 and class bc-heading
      let authorName = html.querySelector('h1.bc-heading');

      let name = authorName.childNodes[0].textContent || authorName.childNodes[0].text || '';
      name = name.replace(/\n/g, '').trim();

      const genres: GenreModel[] = [];
      const tagsRow = html.querySelectorAll('.bc-box.bc-box-padding-none.bc-spacing-top-base');
      if (tagsRow) {
        tagsRow.forEach(tagsRow => {
          const tags = tagsRow.querySelectorAll('.bc-link');
          tags.forEach(tag => {
            const tagSpan = tag.querySelector('span');
            const tagText = tagSpan.textContent || tagSpan.querySelector('span').innerText;
            if (tagText !== undefined && tagText.length > 0) {
              const link = tag.getAttribute('href');
              const beforeQuestionMark = link.split('?')[0];
              const parts = beforeQuestionMark.split('/');
              const asin = parts[parts.length - 1];
              genres.push({
                asin: asin,
                name: tagText,
                type: 'Genres',
              });
            }
          });
          if (genres.length !== 0) return;
        });
      }

      const image = html.querySelector('.image-mask.app-image-position.author-image-outline');

      let imageLink: string;
      if (image) {
        const imageSrc = image.getAttribute('src');
        imageLink = imageSrc.replace('SX120_CR0,0,120,120', 'SX512_CR0,0,512,512');
      }

      return {
        asin: asin,
        name: name,
        region: region,
        genres: genres,
        image: imageLink,
        description: seriesInfoHtml.length > 0 ? seriesInfoHtml.trim() : undefined,
      };
    } else if (response.status >= 500) {
      throw new Error('Failed to fetch series data');
    }
    return undefined;
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return undefined;
    }
    console.error(e);
    throw new Error('Failed to fetch series data');
  }
}

export async function upsertAuthor(author: AuthorModel): Promise<AuthorModel | undefined> {
  if (author) {
    const genreOperations =
      author.genres?.map(genre =>
        prisma.genre.upsert({
          where: { asin: genre.asin },
          update: {
            name: genre.name,
            type: genre.type,
          },
          create: {
            asin: genre.asin,
            name: genre.name,
            type: genre.type,
          },
        })
      ) || [];

    // Execute all genre operations first
    await Promise.all(genreOperations);

    // Then upsert the author with genre connections
    const test = await prisma.author.upsert({
      where: {
        asin_region: {
          asin: author.asin,
          region: author.region.toUpperCase(),
        },
      },
      update: {
        name: author.name,
        description: author.description,
        image: author.image,
        genres:
          author.genres && author.genres.length > 0
            ? {
                deleteMany: {},
                create: author.genres.map(genre => ({
                  genreAsin: genre.asin,
                })),
              }
            : undefined,
      },
      create: {
        asin: author.asin,
        region: author.region.toUpperCase(),
        name: author.name,
        description: author.description,
        image: author.image,
        genres: {
          create:
            author.genres?.map(genre => ({
              genreAsin: genre.asin,
            })) || [],
        },
      },
    });

    return author;
  }
  return undefined;
}

export async function getAuthors(asin: string, region?: string): Promise<AuthorModel[]> {
  const authors = await prisma.author.findMany({
    where: {
      asin: asin,
      ...(region ? { region: region.toUpperCase() } : {}),
    },
    include: {
      genres: {
        select: {
          genre: true,
        },
      },
    },
  });
  return authors.map(author => mapAuthors(author));
}

/**
 * Searches for an author on Audible directly
 */
export async function searchAudibleAuthor(query: string, region: string) {
  const URL = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/searchsuggestions?=`;

  const params = {
    key_strokes: query,
    site_variant: 'desktop',
  };

  try {
    const response = await axios.get(URL, {
      params: params,
      headers: HEADERS,
    });

    if (response.status === 200) {
      const json = response.data;
      const items = json.model.items;
      for (const item of items) {
        if ((item.view.template as string).indexOf('AuthorItem') >= 0) {
          return {
            asin: item.model.person_metadata.asin,
            name: item.model.person_metadata.name.value,
            image: item.model.person_metadata.profile_image != undefined ? item.model.person_metadata.profile_image.url : undefined,
          };
        }
      }
    } else {
      console.error('Failed to fetch author data');
      return undefined;
    }
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return undefined;
    }
    console.error(e);
    throw new Error('Failed to fetch author data');
  }
  return undefined;
}

/**
 *
 */
export async function searchAudibleAuthorViaBook(query: string, region: string): Promise<AuthorModel> {
  const reqParams = {
    num_results: '5',
    products_sort_by: 'Relevance',
    author: query,
  };
  const url = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products`;

  const response = await axios.get(url, {
    headers: HEADERS,
    params: reqParams,
  });

  if (response.status === 200 && response.data?.products) {
    const asins = response.data.products.map((product: any) => product.asin);
    let books: BookModel[] = await getBooks(asins, region);
    if (books.length === 0) {
      books.push(...(await getBooksFromOtherRegions(undefined, query)));
    }

    const authorAsinCounts: Record<string, number> = books.reduce(
      (counts, book) => {
        if (book.authors && book.authors.length > 0) {
          book.authors.forEach(author => {
            if (author.asin) {
              counts[author.asin] = (counts[author.asin] || 0) + 1;
            }
          });
        }
        return counts;
      },
      {} as Record<string, number>
    );

    const authorAsin = Object.entries(authorAsinCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || null;

    if (authorAsin) {
      let authors: AuthorModel[] = await getAuthors(authorAsin);

      if (authors && authors.length > 0) {
        for (let author of authors) {
          if (author.region.toLowerCase() === region) {
            if (author.description === undefined || author.description === null) {
              const authorModel = await getAuthorDetails(authorAsin, region);
              author = await upsertAuthor(authorModel);
            }

            return author;
          }
        }
        return authors[0];
      }

      const authorModel = await getAuthorDetails(authorAsin, region);
      return await upsertAuthor(authorModel);
    }
  }

  return undefined;
}
