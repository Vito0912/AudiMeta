import { app, HEADERS, prisma, regionMap } from '../app';
import { AuthorModel, BookModel, GenreModel, mapAuthors, mapBook } from '../models/type_model';
import { getAuthorDetails, getAuthors, searchAudibleAuthor, upsertAuthor } from '../util/authors';
import axios from 'axios';
import { BookInput, BookInputFactory, getBooksFromAuthor, getFullBooks, insertBooks } from '../util/book';
import { generateSearchKey, getSearchCacheResult, insertSearchCacheResult } from '../util/searchCache';
import { getBooks } from '../util/bookDB';
import { checkAsin } from '../util/validationMiddleware';

app.get('/author/:asin', async (req, res) => {
  const asin: string = req.params.asin;

  if (!asin || !checkAsin(asin)) {
    res.status(400).send('No asin provided');
    return;
  }

  const region: string = (req.query.region || 'US').toString().toLowerCase();

  let authors: AuthorModel[] = await getAuthors(asin);

  if (authors && authors.length > 0) {
    for (let author of authors) {
      if (author.region.toLowerCase() === region) {
        if (author.description === undefined || author.description === null) {
          const authorModel = await getAuthorDetails(asin, region);
          author = await upsertAuthor(authorModel);
        }

        res.send(author);
        return;
      }
    }
    res.send(authors[0]);
    return;
  }

  const authorModel = await getAuthorDetails(asin, region);
  const author = await upsertAuthor(authorModel);
  if (author) {
    res.send(author);
  } else {
    res.status(404).send('Author not found');
  }
});

app.get('/author/books/:asin', async (req, res) => {
  const asin: string = req.params.asin;

  if (!asin) {
    res.status(400).send('No asin provided');
    return;
  }

  const limit: number | undefined = req.query.limit ? parseInt(req.query.limit.toString()) : undefined;
  const page: number | undefined = req.query.page ? parseInt(req.query.page.toString()) : undefined;
  const region: string = (req.query.region || 'US').toString().toLowerCase();

  const query = generateSearchKey('author/books', asin, region, String(limit));

  const results = await getSearchCacheResult(query, req);
  if (results && results.length > 0) {
    const books = await getBooks(results, region, req);
    if (!books || books.length === 0) {
      res.status(404).send('No books found');
      return;
    }
    res.send(books);
    return;
  }

  // Get first book of author
  let books = (await getBooksFromAuthor(asin, region, limit ?? 10, page ?? 0)) as BookModel[];

  if (books === undefined || books.length === 0) {
    res.status(404).send('No book found for author. Please search for a book of this author first and try again.');
    return;
  }

  const bookAsin = books[0].asin;

  const reqParams = {
    similarity_type: 'ByTheSameAuthor',
    num_results: limit ?? 10,
    response_groups:
      'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
  };
  const url = `https://api.audible${regionMap[region]}/1.0/catalog/products/${bookAsin}/sims`;

  const response = await axios.get(url, {
    headers: HEADERS,
    params: reqParams,
  });

  if (response.status === 200) {
    const json: any = response.data;

    let parsedBooksList: BookInput[] = [];
    for (const product of json.similar_products) {
      const parsedBook: BookInput = BookInputFactory.fromAudibleDate(product, region.toUpperCase());

      if (parsedBook !== undefined) {
        parsedBooksList.push(parsedBook);
      }
    }
    await insertBooks(parsedBooksList);

    const newBooks = (await getFullBooks(
      parsedBooksList.map(book => book.asin),
      region
    )) as BookModel[];

    books = books.concat(newBooks);
  } else {
    console.error('Failed to fetch similar books');
  }

  books = books.filter((book, index, self) => index === self.findIndex(t => t.asin === book.asin));

  await insertSearchCacheResult(
    query,
    books.map(book => book.asin)
  );

  if (limit && page) {
    books = books.slice(page * limit, (page + 1) * limit);
  }

  if (books.length === 0) {
    res.status(404).send('No books found');
    return;
  }

  res.send(books);
});

app.get('/author', async (req, res) => {
  const region: string = (req.query.region || 'US').toString().toLowerCase();
  const cache: string = req.query.cache as string;

  if (!req.query.name) {
    res.status(400).send('No name provided');
    return;
  }

  const audibleResult = await searchAudibleAuthor(req.query.name.toString(), region);

  let authorModel: AuthorModel | undefined = undefined;
  if (audibleResult) {
    authorModel = {
      asin: audibleResult.asin,
      region: region.toUpperCase(),
      name: audibleResult.name,
      description: undefined,
      image: audibleResult.image,
      genres: [],
    };
  }

  // Maybe updated with https://github.com/Kinjalrk2k/prisma-extension-pg-trgm
  const authorQuery = await prisma.author.findFirst({
    where: {
      name: {
        contains: req.query.name.toString(),
        mode: 'insensitive',
      },
    },
  });

  if (authorQuery == null && authorModel === undefined) {
    res.status(404).send('No authors found');
    return;
  }

  let author = mapAuthors(authorQuery);

  if (author.description === null || cache === 'false' || (authorModel && authorModel.image !== author.image)) {
    const authorModel2 = await getAuthorDetails(author.asin, region);
    if (!authorModel) {
      authorModel = authorModel2;
      author = await upsertAuthor(authorModel);
    } else if (authorModel2) {
      authorModel2.description = authorModel2.description || author.description;
      authorModel2.genres = authorModel2.genres || author.genres;
      author = await upsertAuthor(authorModel);
    }
  }

  if (author) {
    res.send(author);
  } else {
    res.status(404).send('Author not found');
  }
});
