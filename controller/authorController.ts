import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {AuthorModel, BookModel, GenreModel, mapAuthors, mapBook} from "../models/type_model";
import {getAuthors, upsertAuthor} from "../util/authors";
import {oaAsinPath, oaAuthor, oaBook, oaCache, oaLimit, oaPage, oaRegion} from "../util/openApiModels";
import axios from "axios";
import {BookInput, BookInputFactory, getBooksFromAuthor, getFullBooks, insertBooks} from "../util/book";
import {generateSearchKey, getSearchCacheResult, insertSearchCacheResult} from "../util/searchCache";
import {getBooks} from "../util/bookDB";

app.get('/author/:asin',
    oapi.path({
        tags: ['author'],
        summary: 'Get an author',
        parameters: [
            oaRegion,
            oaAsinPath
        ],
        responses: {
            200: {
                description: 'Book found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: oaAuthor
                        }
                    }
                }
            }
        }
    }),
    async (req, res) => {

        const asin: string = req.params.asin;
        const region: string = (req.query.region || 'US').toString().toLowerCase();

        let authors: AuthorModel[] = await getAuthors(asin);

        if (authors && authors.length > 0) {
            for (let author of authors) {
                if (author.region.toLowerCase() === region) {

                    if (author.description === undefined || author.description === null) {
                        author = await upsertAuthor(asin, region);
                    }

                    res.send(author);
                    return;
                }
            }
            res.send(authors[0]);
            return;
        }

        const author = await upsertAuthor(asin, region);
        if (author) {
            res.send(author);
        } else {
            res.status(404).send("Author not found");
        }
    });

app.get('/author/books/:asin',
    oapi.path({
        tags: ['author'],
        summary: 'Get books of an author',
        parameters: [
            oaRegion,
            oaAsinPath,
            oaLimit,
            oaPage,
            oaCache
        ],
        responses: {
            200: {
                description: 'Books found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: oaBook
                            }
                        }
                    }
                }
            }
        }
    }),
   async  (req, res) => {
        const asin: string = req.params.asin;
        const limit: number | undefined = req.query.limit ? parseInt(req.query.limit.toString()) : undefined;
        const page: number | undefined = req.query.page ? parseInt(req.query.page.toString()) : undefined;
        const region: string = (req.query.region || 'US').toString().toLowerCase();

       const query = generateSearchKey('author/books', asin, region, limit.toString());

       const results = await getSearchCacheResult(query, req);

       if (results) {
           const books = await getBooks(results, region, req)
            res.send(books);
           return;
       }

        // Get first book of author
        let books = await getBooksFromAuthor(asin, region, limit ?? 10, page ?? 0) as BookModel[];

        if (books === undefined || books.length === 0) {
            res.status(404).send("No book found for author. Please search for a book of this author first and try again.");
            return;
        }


        const bookAsin = books[0].asin;

       const reqParams = {
           'similarity_type': 'ByTheSameAuthor',
           'num_results': limit ?? 10,
           'response_groups': 'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
       }
       const url = `https://api.audible${regionMap[region]}/1.0/catalog/products/${bookAsin}/sims`;

       const response = await axios.get(url, {
           headers: HEADERS,
          params: reqParams
       });

       if (response.status === 200) {
           const json: any = response.data;

           let parsedBooksList: BookInput[] = [];
           for (const product of json.similar_products) {
               const parsedBook: BookInput = BookInputFactory.fromAudibleDate(product, region.toUpperCase())

               if(parsedBook !== undefined) {
                   parsedBooksList.push(parsedBook);
               }
           }
           await insertBooks(parsedBooksList);

           const newBooks = await getFullBooks(parsedBooksList.map(book => book.asin), region) as BookModel[];

           books = books.concat(newBooks);
       } else {
           console.error("Failed to fetch similar books");
       }

         books = books.filter((book, index, self) =>
              index === self.findIndex((t) => (
                t.asin === book.asin
              ))
         );

       await insertSearchCacheResult(query, books.map(book => book.asin));

       if (limit && page) {
              books = books.slice(page * limit, (page + 1) * limit);
       }

       res.send(books);
    })

