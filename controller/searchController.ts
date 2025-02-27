import axios from "axios";
import {BookInput, getBooksFromOtherRegions} from "../util/book";
import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {Book} from "@prisma/client";
import {getBooks} from "../util/bookDB";
import {oaBook, oaCache, oaRegion} from "../util/openApiModels";
import {BookModel} from "../models/type_model";
import {generateSearchKey, getSearchCacheResult, insertSearchCacheResult} from "../util/searchCache";


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
app.get('/search',
    oapi.path({
        tags: ['search'],
        summary: 'Search for books',
        parameters: [
            {
                name: 'author',
                in: 'query',
                description: 'The author of the book. Needs to be provided if title is not provided',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'title',
                in: 'query',
                description: 'The title of the book. Needs to be provided if author is not provided',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'localTitle',
                in: 'query',
                description: 'Just like title this matches the title of the book. LocalTitle only searches in the database. This increases speed but needs a nearly exact match',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'localAuthor',
                in: 'query',
                description: 'Just like author this matches the author of the book. LocalAuthor only searches in the database. This increases speed but needs a nearly exact match',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'localNarrator',
                in: 'query',
                description: 'Just like narrator this matches the narrator of the book. LocalNarrator only searches in the database. This increases speed but needs a nearly exact match',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'localGenre',
                in: 'query',
                description: 'Just like genre this matches the genre of the book. LocalGenre only searches in the database. This increases speed but needs a nearly exact match',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'localSeries',
                in: 'query',
                description: 'Just like series this matches the series of the book. LocalSeries only searches in the database. This increases speed but needs a nearly exact match',
                required: false,
                schema: {
                    type: 'string'
                }
            },
            oaRegion,
            oaCache
        ],
        responses: {
            200: {
                description: 'Server reachable',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: oaBook
                        }
                    }
                }
            }
        }
    }),
    async (req, res) => {
    const author: string | null = req.query.author ? req.query.author.toString() : null;
    const title: string | null = req.query.title ? req.query.title.toString() : null;

    const localTitle: string | null = req.query.localTitle ? req.query.localTitle.toString() : null;
    const localAuthor: string | null = req.query.localAuthor ? req.query.localAuthor.toString() : null;
    const localNarrator: string | null = req.query.localNarrator ? req.query.localNarrator.toString() : null;
    const localGenre: string | null = req.query.localGenre ? req.query.localGenre.toString() : null;
    const localSeries: string | null = req.query.localSeries ? req.query.localSeries.toString() : null;

    const limit: number | undefined = req.query.limit ? parseInt(req.query.limit.toString()) : undefined;
    const page: number | undefined = req.query.page ? parseInt(req.query.page.toString()) : undefined;

    const region: string = (req.query.region || 'us').toString();

    if ((title == null || title.length === 0) && (author == null || author.length === 0)) {

        const inputs = [localTitle, localAuthor, localNarrator, localGenre, localSeries];

        if(inputs.every(input => !input)) {
            res.status(400).send("Author or title or any local search must be provided");
            return;
        }

        //TODO: Implement local search

    }

    if (!regionMap[region.toLowerCase()]) {
        res.status(400).send("Invalid region");
        return;
    }

    const key = generateSearchKey(title, author, region)

    let asins: string[] = [];

    try {
        asins = await getSearchCacheResult(key, req, limit, page);
    } catch (e) {

    }


    try {
        if (!asins || asins.length === 0) {
            const reqParams = {
                num_results: limit === undefined ? '10' :  limit.toString(),
                products_sort_by: 'Relevance'
            }
            if (author) {
                reqParams['author'] = author;
            }
            if (title) {
                reqParams['title'] = title;
            }
            const url = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products`;

            const response = await axios.get(url, {
                headers: HEADERS,
                params: reqParams
            });

            if (response.status === 200) {
                const json: any = response.data;

                asins = json.products.map((product: any) => product.asin);

                if(asins.length >= 1) {
                    await insertSearchCacheResult(key, asins);
                }
            }
        }

        let books: BookModel[] = await getBooks(asins, region, req, limit, page);
        if (books.length === 0) {
            const otherBooks = await getBooksFromOtherRegions(title, author, limit, page)
            if (otherBooks.length === 0) {
                res.status(404).send("No books found");
                return;
            }
            res.send(otherBooks);
            return;
        }

        res.send(books);
        return;
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }

});