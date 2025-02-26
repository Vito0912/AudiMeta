import {getBooksInSeries, getSeriesAsins, getSeriesDetails, updateSeries} from "../util/series";
import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {oaAsinPath, oaBook, oaRegion, oaSeries} from "../util/openApiModels";
import {BookModel, SeriesInfoModel} from "../models/type_model";

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

    let books: BookModel[] = await getBooksInSeries(req.params.asin);

    // TODO: Add sorting by position in series

    res.send(books);
});


app.get('/series/:asin',
    oapi.path({
        tags: ['series'],
        summary: 'Gets information about a series',
        parameters: [
            oaRegion,
            oaAsinPath
        ],
        responses: {
            200: {
                description: 'Server reachable',
                content: {
                    'application/json': {
                        schema: oaSeries
                    }
                }
            }
        }
    }),
    async (req, res) => {
        const asin: string = req.params.asin;
        const region: string = (req.query.region || 'US').toString().toLowerCase();

        const series = await prisma.series.findUnique({
            where: {asin: asin}
        });

        if (series && series.description && series.title) {
            res.send(series);
            return;
        }
        try {
            const seriesInfo = await getSeriesDetails(asin, region);

            if (seriesInfo === undefined) {
                res.status(404).send("Series not found");
                return
            }

            res.send(await prisma.series.upsert({
                where: {
                    asin: asin
                },
                update: {
                    ...(seriesInfo.description && { description: seriesInfo.description }),
                    ...(seriesInfo.title && { title: seriesInfo.title })
                },
                create: {
                    asin: asin,
                    title: seriesInfo.title,
                    description: seriesInfo.description
                }
            }));
        } catch (e) {
            res.status(202).send(e.message);
        }


    }
    );

