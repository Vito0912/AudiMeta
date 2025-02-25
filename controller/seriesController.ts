import {getBooksInSeries, getSeriesAsins} from "../util/series";
import {app, oapi, prisma, regionMap} from "../app";
import {getBooks} from "../util/bookDB";
import {Book} from "@prisma/client";
import {oaBook, oaRegion} from "../util/openApiModels";

/**
 * Returns all books in a series
 */
// @ts-ignore
app.get('/series/books/:asin',
    oapi.path({
        tags: ['series'],
        summary: 'Gets all books in a series',
        parameters: [
            oaRegion,
            {
                name: 'asin',
                in: 'path',
                description: 'The asin of the series',
                required: true,
                schema: {
                    type: 'string'
                }
            }
        ],
        responses: {
            200: {
                description: 'Server reachable',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: oaBook
                        }
                    }
                }
            }
        }
    }),
    async (req, res) => {

    const region: string = req.query.region as string;

    if (!region || !regionMap[region.toLowerCase()]) {
         res.status(400).send("Region not provided");
        return;
    }

    const forceUpdate = req.query.forceUpdate;
    if (forceUpdate !== undefined) {
         res.send(await updateSeries(req, res, region));
        return;
    }

    res.send(await getBooksInSeries(req.params.asin));
});

async function updateSeries(req: any, res: any, region: string) {

        const seriesAsins = await getSeriesAsins(req.params.asin);
        // Split in chunks of 50
        const asins = seriesAsins.reduce((resultArray: string[][], item, index) => {
            const chunkIndex = Math.floor(index/50)

            if(!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = []
            }

            resultArray[chunkIndex].push(item)

            return resultArray
        }, []);

        let books: Book[] = [];

        for (const chunk of asins) {
            books = books.concat(await getBooks(chunk, region, req));
        }

        // Only return not null books
        return books.filter(book => book != null);
}