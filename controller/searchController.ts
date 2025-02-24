import axios from "axios";
import {BookInput, getBooksFromOtherRegions} from "../util/book";
import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {Book} from "@prisma/client";
import {getBooks} from "../util/bookDB";
import {oaBook, oaRegion} from "../util/openApiModels";


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
app.get('/search', oapi.path({
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
        oaRegion
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
    // @ts-ignore
    async (req, res) => {
    const author: string | null = req.query.author ? req.query.author.toString() : null;
    const title: string | null = req.query.title ? req.query.title.toString() : null;

    const localTitle: string | null = req.query.localTitle ? req.query.localTitle.toString() : null;
    const localAuthor: string | null = req.query.localAuthor ? req.query.localAuthor.toString() : null;
    const localNarrator: string | null = req.query.localNarrator ? req.query.localNarrator.toString() : null;
    const localGenre: string | null = req.query.localGenre ? req.query.localGenre.toString() : null;
    const localSeries: string | null = req.query.localSeries ? req.query.localSeries.toString() : null;

    const region: string = (req.query.region || 'us').toString();

    if ((title == null || title.length === 0) && (author == null || author.length === 0)) {

        const inputs = [localTitle, localAuthor, localNarrator, localGenre, localSeries];

        if(inputs.every(input => !input)) {
            return res.status(400).send("Author or title or any local search must be provided");
        }

        //TODO: Implement local search

    }

    if (!regionMap[region.toLowerCase()]) {
        return res.status(400).send("Invalid region");
    }

    const key = `${title}${author ? '-' + author : ''}-${region}`.toLowerCase();

    let asins: string[] = [];

    try {
        const search = await prisma.bookSearch.update({
            where: {
                query: key
            },
            data: {
                count: {
                    increment: 1
                }
            }
        });

        if(search && search.result) {
            asins = search.result;
        }
    } catch (e) {

    }


    try {
        if (asins.length === 0) {
            const reqParams = {
                num_results: '20',
                products_sort_by: 'Relevance'
            }
            if (author) {
                reqParams['author'] = author;
            }
            if (title) {
                reqParams['title'] = title;
            }

            console.log(reqParams);

            const url = `https://api.audible${regionMap[region.toLowerCase()]}/1.0/catalog/products`;

            const response = await axios.get(url, {
                headers: HEADERS,
                params: reqParams
            });

            if (response.status === 200) {
                const json: any = response.data;

                asins = json.products.map((product: any) => product.asin);

                if(asins.length >= 1) {
                    await prisma.bookSearch.upsert({
                        where: {
                            query: key
                        },
                        create: {
                            query: key,
                            result: asins
                        },
                        update: {}
                    });
                    console.log("Search created and asins added", key, asins);
                }
            }
        }

        const books: Book[] = await getBooks(asins, region, req);

        if (books.length === 0) {
            console.log("No books found for", key);
            return res.send(await getBooksFromOtherRegions(title, author));
        }

        return res.send(books);
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }

});