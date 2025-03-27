import axios from 'axios';
import { BookInput, getBooksFromOtherRegions, selectLocalBooks } from '../util/book';
import { app, HEADERS, logger, prisma, regionMap } from '../app';
import { getBooks } from '../util/bookDB';
import { BookModel } from '../models/type_model';
import { generateSearchKey, getSearchCacheResult, insertSearchCacheResult } from '../util/searchCache';

/**
 * Returns all books that match the search query parameters
 * If search already exists, returns the cached results
 * If books are not in the database, fetches them from the Audible API
 *
 * If an asin is found in the database, it is returned despite the region
 *
 * @param author - The author of the book
 * @param title - The title of the book
 * @param region - The region to search in
 *
 * @returns The books that match the search query parameters
 */

// @ts-ignore
app.get('/search', async (req, res) => {
  let author: string | null = req.query.author ? req.query.author.toString() : null;
  let title: string | null = req.query.title ? req.query.title.toString() : null;

  const localTitle: string | null = req.query.localTitle ? req.query.localTitle.toString() : null;
  const localAuthor: string | null = req.query.localAuthor ? req.query.localAuthor.toString() : null;
  const localNarrator: string | null = req.query.localNarrator ? req.query.localNarrator.toString() : null;
  const localGenre: string | null = req.query.localGenre ? req.query.localGenre.toString() : null;
  const localSeries: string | null = req.query.localSeries ? req.query.localSeries.toString() : null;
  const localSeriesPosition: string | null = req.query.localSeriesPosition ? req.query.localSeriesPosition.toString() : null;
  const localIsbn: string | null = req.query.localIsbn ? req.query.localIsbn.toString() : null;

  const limit: number | undefined = req.query.limit ? parseInt(req.query.limit.toString()) : undefined;
  const page: number | undefined = req.query.page ? parseInt(req.query.page.toString()) : undefined;

  let regions: string[] = req.query.region ? req.query.region.toString().split(',') : ['us'];
  regions = regions.filter((region, index) => regions.indexOf(region) === index).map(region => region.toLowerCase());

  if ((title == null || title.length === 0) && (author == null || author.length === 0)) {
    const inputs = {
      localTitle,
      localAuthor,
      localNarrator,
      localGenre,
      localSeries,
      localSeriesPosition,
      localIsbn
    };

    if (Object.values(inputs).filter(value => value).length === 0) {
      res.status(400).send('Author or title or isbn or any local search must be provided');
      return;
    }

    const books = await selectLocalBooks(inputs, limit, page);

    if (books && books.length >= 1) {
      res.send(books);
      return;
    }

    res.status(404).send('No books found');
    return;
  }

  if (title) {
    title = title.replace(/\[.*?]/g, '').replace(/[\[\]]/g, '');
  }
  if (author) {
    author = author.replace(/\[.*?]/g, '').replace(/[\[\]]/g, '');
  }

  for (let index = 0; index < regions.length; index++) {
    const region = regions[index].toLowerCase();
    if (!regionMap[region.toLowerCase()]) {
      res.status(400).send('Invalid region');
      return;
    }

    const key = generateSearchKey('search', title, author, region, String(limit), String(page));

    let asins: string[] = [];

    try {
      asins = await getSearchCacheResult(key, req, limit, page);
    } catch (e) {}

    try {
      if (!asins || asins.length === 0) {
        const reqParams = {
          num_results: limit === undefined ? '10' : limit.toString(),
          products_sort_by: 'Relevance',
        };
        if (author) {
          reqParams['author'] = author;
        }
        if (title) {
          reqParams['title'] = title;
        }
        const url = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products`;

        const response = await axios.get(url, {
          headers: HEADERS,
          params: reqParams,
        });

        if (response.status === 200) {
          const json: any = response.data;

          asins = json.products.map((product: any) => product.asin);

          if (asins.length >= 1) {
            await insertSearchCacheResult(key, asins);
          }
        }
      }

      let books: BookModel[] = await getBooks(asins, region, limit, page);
      if (index == regions.length && books.length === 0) {
        const otherBooks = await getBooksFromOtherRegions(title, author, limit, page);
        if (otherBooks.length === 0) {
          res.status(404).send('No books found');
          return;
        }
        res.send(otherBooks);
        return;
      }

      if (books && books.length >= 1) {
        res.send(books);
        return;
      }
    } catch (e) {
      logger.error(e);
      res.status(500).send('Internal Server error');
      return;
    }
  }
  res.status(404).send('No books found');
});
