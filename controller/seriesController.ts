import {getBooksInSeries, getSeriesAsins} from "../util/series";
import {app, prisma} from "../app";
import {getBooks} from "../util/bookDB";
import {Book} from "@prisma/client";

/**
 * Returns all books in a series
 */
// @ts-ignore
app.get('/series/:asin', async (req, res) => {

    const region: string = req.query.region as string;

    if (!region) {
        return res.status(400).send("Region not provided");
    }

    const forceUpdate = req.query.forceUpdate;
    if (forceUpdate !== undefined) {
        const series = await prisma.series.findUnique({
            where: {
                asin: req.params.asin
            }
          })

        if (series !== undefined && series.updatedAt) {
            const now = new Date();
            const diff = now.getTime() - series.updatedAt.getTime();
            // If a day has passed since the last update, update the series
            if (diff > 86400000) {
                return res.send(await updateSeries(req, res, region));
            }
        } else if(series === undefined) {
            return res.send(await updateSeries(req, res, region));
        }
    }

    return res.send(await getBooksInSeries(req.params.asin))
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

        return res.send(books);

}