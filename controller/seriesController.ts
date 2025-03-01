import {getBooksInSeries, getSeriesAsins, getSeriesDetails, updateSeries} from "../util/series";
import {app, HEADERS, prisma, regionMap} from "../app";
import {BookModel, SeriesInfoModel} from "../models/type_model";

/**
 * Returns all books in a series
 */
app.get('/series/books/:asin', async (req, res) => {

    const asin: string = req.params.asin;

    if (!asin) {
        res.status(400).send("No asin provided");
        return;
    }

    const region: string = req.query.region as string;
    const forceUpdate = req.query.update;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;

    let books: BookModel[] = await getBooksInSeries(req.params.asin, limit, page);

    if ((forceUpdate !== undefined && forceUpdate === 'true')  || (books !== null && books.length === 0)) {
        const series = await updateSeries(req, res, region, limit, page)
        if (!series || series.length === 0) {
            res.status(404).send("No books in series found or series not found");
            return;
        }
        res.send(series);
        return;
    }

    if(!books || books.length === 0) {
        res.status(404).send("No books in series found or series not found");
        return;
    }

    const sortedBooks = books.sort((a, b) => {
        const aSeries = a.series && a.series.length > 0 ? a.series[0] : undefined;
        const bSeries = b.series && b.series.length > 0 ? b.series[0] : undefined;

        const aPosition = aSeries && aSeries.position != null ? aSeries.position : Number.POSITIVE_INFINITY;
        const bPosition = bSeries && bSeries.position != null ? bSeries.position : Number.POSITIVE_INFINITY;

        return aPosition - bPosition;
    });

    if (books.length === 0) {
        res.status(404).send("No books in series found or series not found");
        return
    }

    res.send(sortedBooks);
});


app.get('/series/:asin', async (req, res) => {
        const asin: string = req.params.asin;

        if (!asin) {
            res.status(400).send("No asin provided");
            return;
        }

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
            res.status(202).send('Try again later');
        }
    }
);

