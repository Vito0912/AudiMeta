import {
  getBooksInSeries,
  sortBooksBySeries,
  updateDetailedSeries,
  updateSeries,
} from '../util/series';
import { app, HEADERS, logger, prisma, regionMap } from '../app';
import { BookModel, mapSeries } from '../models/type_model';
import { checkAsin } from '../util/validationMiddleware';
import axios from 'axios';
import { generateSearchKey, getSearchCacheResult, insertSearchCacheResult } from '../util/searchCache';
import { getBooks } from '../util/bookDB';
import { getBooksFromOtherRegions } from '../util/book';

/**
 * Returns all books in a series
 */
app.get('/series/books/:asin', async (req, res) => {
  const asin: string = req.params.asin;

  if (!asin || !checkAsin(asin)) {
    res.status(400).send('No asin provided');
    return;
  }

  const region: string = req.query.region as string || 'US';
  const forceUpdate = req.query.update;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;

  let books: BookModel[] = await getBooksInSeries(req.params.asin, limit, page);

  if ((forceUpdate !== undefined && forceUpdate === 'true') || (books !== null && books.length === 0)) {
    const series = await updateSeries(req, res, region, limit, page);
    if (!series || series.length === 0) {
      res.status(404).send('No books in series found or series not found');
      return;
    }
    res.send(sortBooksBySeries(series, req.params.asin));
    return;
  }

  if (!books || books.length === 0) {
    res.status(404).send('No books in series found or series not found');
    return;
  }

  if (books.length === 0) {
    res.status(404).send('No books in series found or series not found');
    return;
  }

  res.send(sortBooksBySeries(books, req.params.asin));
});

app.get('/series/:asin', async (req, res) => {
  const asin: string = req.params.asin;

  if (!asin || !checkAsin(asin)) {
    res.status(400).send('No asin provided');
    return;
  }

  const region: string = (req.query.region || 'US').toString().toLowerCase();

  const series = await prisma.series.findUnique({
    where: { asin: asin },
  });

  if (series && series.description && series.title) {
    res.send(series);
    return;
  }

  try {

    const seriesInfo = await updateDetailedSeries(asin, region);

    if (seriesInfo === undefined) {
      res.status(404).send('Series not found');
      return;
    }

    res.send(seriesInfo);
  } catch (e) {
    res.status(202).send('Try again later');
  }
});

app.get('/series', async (req, res) => {
  const region: string = (req.query.region || 'US').toString().toLowerCase();
  const name: string = req.query.name as string;

  if (!name) {
    res.status(400).send('No name provided');
    return;
  }

  const key = generateSearchKey('series', name, region)

  const asins = await getSearchCacheResult(key, req);

  if(asins && asins.length > 0) {
    const asin = asins[0];
    const series = await prisma.series.findUnique({
      where: { asin: asin },
    });

    if (series && series.description && series.title) {
      res.send(mapSeries(series));
      return;
    }

    const seriesInfo = await updateDetailedSeries(asin, region);

    if (seriesInfo === undefined) {
      res.status(404).send('Series not found');
      return;
    }

    res.send(seriesInfo);
  }

  try {
    const reqParams = {
      num_results: '3',
      products_sort_by: 'Relevance',
      title: name,
    };
    const url = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products`;

    const response = await axios.get(url, {
      headers: HEADERS,
      params: reqParams,
    });

    if (response.status === 200 && response.data != null && response.data.products != null) {
      const asins = response.data.products.map((product: any) => product.asin);

      let books: BookModel[] = await getBooks(asins, region, req);
      if (books.length === 0) {
        const newBooks = await getBooksFromOtherRegions(name, undefined);
        books.push(...newBooks);
      }

      const seriesAsin = books.find(book => book.series && book.series.length > 0)?.series[0]?.asin || null;

      if (seriesAsin == null) {
        res.status(404).send('No series found');
        return;
      }

      await insertSearchCacheResult(key, [seriesAsin]);


      const series = await prisma.series.findUnique({
        where: { asin: seriesAsin },
      });

      if (series && series.description && series.title) {
        res.send(mapSeries(series));
        return;
      }

      const seriesInfo = await updateDetailedSeries(seriesAsin, region);

      if (seriesInfo === undefined) {
        res.status(404).send('Series not found');
        return;
      }

      res.send(seriesInfo);
    }

  } catch (e) {
    logger.error(e);
  }
  res.status(404).send('No series found');
});