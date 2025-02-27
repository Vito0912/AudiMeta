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
            oaAsinPath
        ],
        responses: {
            200: {
                description: 'Server reachable',
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
    async (req, res) => {

    const region: string = req.query.region as string;
    const forceUpdate = req.query.update;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;

    if (forceUpdate !== undefined && forceUpdate === 'true') {
         res.send(await updateSeries(req, res, region, limit, page));
        return;
    }

    let books: BookModel[] = await getBooksInSeries(req.params.asin, limit, page);

    const sortedBooks = books.sort((a, b) => {
        const aSeries = a.series && a.series.length > 0 ? a.series[0] : undefined;
        const bSeries = b.series && b.series.length > 0 ? b.series[0] : undefined;

        const aPosition = aSeries && aSeries.position != null ? aSeries.position : Number.POSITIVE_INFINITY;
        const bPosition = bSeries && bSeries.position != null ? bSeries.position : Number.POSITIVE_INFINITY;

        return aPosition - bPosition;
    });

    res.send(sortedBooks);
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
                        schema: {
                            type: 'object',
                            properties: oaSeries
                        }
                    }
                }
            },
            404: {
                description: 'Series not found'
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

