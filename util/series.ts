import { Book } from '@prisma/client';
import { HEADERS, logger, prisma, regionMap } from '../app';
import axios from 'axios';
import { BookModel, mapBook, mapSeries, SeriesInfoModel } from '../models/type_model';
import parse from 'node-html-parser';
import { getBooks } from './bookDB';
import { generateSearchKey, getSearchCacheResult, insertSearchCacheResult } from './searchCache';
import { checkAsin } from './validationMiddleware';
import { generateRandomCookie, generateScrapingHeaders } from './audible_scraping';
import { bookInclude } from './book';

export async function getBooksInSeries(seriesAsin: string, limit?: number, page?: number): Promise<BookModel[]> {
  logger.info('Getting books in series ' + seriesAsin);
  const books = await prisma.book.findMany({
    where: {
      series: {
        some: {
          series: {
            asin: seriesAsin,
          },
        },
      },
    },
    include: bookInclude,
    ...(limit ? { take: limit } : {}),
    ...(page ? { skip: page * limit } : {}),
  });

  if (books == null || books.length === 0) {
    return [];
  }

  return books.map(book => mapBook(book));
}

export async function getSeriesAsins(asin: string, region: string): Promise<string[]> {
  const URL = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products/${asin}`;

  const response = await axios.get(URL, {
    headers: HEADERS,
    params: { response_groups: 'relationships' },
  });

  if (response.status === 200) {
    const json: any = response.data;
    if (!json.product.relationships) {
      return [];
    }
    return json.product.relationships
      .filter((relation: any) => relation.relationship_to_product == 'child' && relation.relationship_type == 'series')
      .map((series: any) => series.asin);
  }
}

export async function getSeriesDetails(asin: string, region: string): Promise<SeriesInfoModel | undefined> {
  const URL = `https://audible${regionMap[region]}/series/${asin}?ipRedirectOverride=true&overrideBaseCountry=true`;
  const MAX_RETRIES = 5;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let retries = 0;

  while (true) {
    try {
      const response = await axios.get(URL, {
        headers: generateScrapingHeaders(region),
      });

      if (response.status === 200) {
        if (response.request.path.includes('ipRedirectOriginalURL=404')) {
          return undefined;
        }

        const htmlContent = response.data;
        const html = parse(htmlContent);

        let seriesInfoHtml = '';

        // Div with bc-expander-content
        const seriesInfo = html.querySelector('.bc-expander-content');

        if (seriesInfo) {
          const firstDivSeriesInfo = seriesInfo.querySelector('div');
          const innerHtml = firstDivSeriesInfo.innerHTML;

          seriesInfoHtml = innerHtml.toString();

          // Minimize the seriesInfoHtml (Strip chunks of whitespace)
          seriesInfoHtml = seriesInfoHtml.replace(/\s{2,}/g, ' ');
        }

        let titleName = html.querySelector('h1.bc-heading');

        let title = titleName.childNodes[0].textContent || titleName.childNodes[0].text || '';
        title = title.replace(/\n/g, '').trim();

        return {
          asin: asin,
          title: title,
          description: seriesInfoHtml.length > 0 ? seriesInfoHtml.trim() : undefined,
        };
      }
    } catch (e) {
      // Check if axios error with 503 status (Audible blocking sometimes)
      if (e.response && e.response.status === 503) {
        retries++;

        if (retries >= MAX_RETRIES) {
          logger.warn(`Failed to fetch series data after ${MAX_RETRIES} retries for ${asin}`);
          throw new Error(`Failed to fetch series data after ${MAX_RETRIES} retries`);
        }

        const waitTime = Math.random() * 700 + 300;
        await delay(waitTime);
        continue;
      }

      logger.error(e);
      throw new Error('Failed to fetch series data');
    }
  }
}

export async function updateSeries(req: any, res: any, region: string, limit?: number, page?: number) {
  const key = generateSearchKey('series/update', req.params.asin, region);
  let seriesAsins = await getSearchCacheResult(key, req, limit, page);

  if (!seriesAsins || seriesAsins.length === 0) {
    seriesAsins = await getSeriesAsins(req.params.asin, region);

    if (seriesAsins && seriesAsins.length >= 1) await insertSearchCacheResult(key, seriesAsins);

    if (limit && page) {
      seriesAsins = seriesAsins.slice(page * limit, (page + 1) * limit);
    }
  }

  // Split in chunks of 50
  const asins = seriesAsins.reduce((resultArray: string[][], item, index) => {
    const chunkIndex = Math.floor(index / 50);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);

  let books: BookModel[] = [];

  for (const chunk of asins) {
    books = books.concat(await getBooks(chunk, region));
  }

  return books.filter(book => book != null);
}

export function sortBooksBySeries(books: BookModel[], seriesAsin: string): BookModel[] {
  const bookPositions = new Map<string, string>();
  for (const book of books) {
    const seriesInfo = book.series?.find(s => s.asin === seriesAsin);
    const position = seriesInfo?.position ?? '0';
    bookPositions.set(book.asin, position);
  }

  books.sort((a, b) => {
    const positionA = bookPositions.get(a.asin) || '0';
    const positionB = bookPositions.get(b.asin) || '0';

    // Position "0" is appended to the end
    if (positionA === '0' && positionB !== '0') return 1;
    if (positionA !== '0' && positionB === '0') return -1;

    return positionA.localeCompare(positionB, undefined, { numeric: true });
  });

  return books;
}

export async function updateDetailedSeries(asin: string, region: string) {
  const seriesInfo = await getSeriesDetails(asin, region);

  if (seriesInfo) {
    await prisma.series.upsert({
      where: {
        asin: asin,
      },
      update: {
        ...(seriesInfo.description && { description: seriesInfo.description }),
        ...(seriesInfo.title && { title: seriesInfo.title }),
      },
      create: {
        asin: asin,
        title: seriesInfo.title,
        description: seriesInfo.description,
      },
    });
  }

  return seriesInfo;
}

export async function getCachedOrSeries(asin: string, region: string) {
  const series = await prisma.series.findUnique({
    where: { asin },
  });

  if (series && series.description && series.title) {
    return mapSeries(series);
  }

  return await updateDetailedSeries(asin, region);
}
