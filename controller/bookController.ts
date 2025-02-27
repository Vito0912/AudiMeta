import {app, oapi, regionMap} from "../app";
import {getBook, getBooks} from "../util/bookDB";
import {oaAsinPath, oaAsinQuery, oaBook, oaCache, oaRegion} from "../util/openApiModels";

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 */
// @ts-ignore
app.get('/book/:asin',
    oapi.path({
        tags: ['book'],
        summary: 'Get a book',
        parameters: [
            oaRegion,
            oaAsinPath,
            oaCache
        ],
        responses: {
            200: {
                description: 'Book found',
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
    // @ts-ignore
    async (req, res) => {
    const asin: string = req.params.asin;
    const region: string = (req.query.region || 'US').toString().toLowerCase();
    const cache: string = req.query.cache as string;

    try {
        const book = await getBook(asin, region, req, cache);
        if (!book) {
            return res.status(404).send("Book not found");
        }
        res.send(book);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error');
    }
});

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 *
 * @param asins - The asins of the books separated by commas
 */
// @ts-ignore
app.get('/book',
    oapi.path({
        tags: ['book'],
        summary: 'Get multiple books',
        parameters: [
            oaRegion,
            oaAsinQuery
        ],
        responses: {
            200: {
                description: 'Books',
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
    // @ts-ignore
    async (req, res) => {
    const asinsQuery: string = req.query.asins as string;
    const region: string = (req.query.region || 'US').toString().toLowerCase();

    if(!asinsQuery) {
        return res.status(400).send("No asins provided");
    }

    const asins = asinsQuery.split(',');
    if (asins.length === 0) {
        return res.status(400).send("No asins provided");
    } else if (asins.length > 50) {
        return res.status(400).send("Too many asins provided");
    }

    if (!regionMap[region.toLowerCase()]) {
        return res.status(400).send("Invalid region");
    }

    try {
        const books = await getBooks(asins, region, req);
        res.send(books);
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
});