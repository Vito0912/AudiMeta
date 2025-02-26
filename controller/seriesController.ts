import {getBooksInSeries, getSeriesAsins} from "../util/series";
import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {getBooks} from "../util/bookDB";
import {oaBook, oaRegion} from "../util/openApiModels";
import {BookModel, SeriesInfoModel} from "../models/type_model";
import axios from "axios";
import parse from "node-html-parser";

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

        let books: BookModel[] = [];

        for (const chunk of asins) {
            books = books.concat(await getBooks(chunk, region, req));
        }

        // Only return not null books
        return books.filter(book => book != null);
}

app.get('/series/:asin',
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

async function getSeriesDetails(asin: string, region: string): Promise<SeriesInfoModel | undefined> {

    const URL = `https://audible${regionMap[region]}/series/${asin}?ipRedirectOverride=true&overrideBaseCountry=true`;

    try {
        const response = await axios.get(URL, {
            headers: HEADERS
        });

        console.log(response.request.path);
        if (response.status === 200) {

            if (response.request.path.includes("ipRedirectOriginalURL=404")) {
                return undefined;
            }

            const htmlContent = response.data;
            const html = parse(htmlContent);


            // Div with bc-expander-content
            const seriesInfo = html.querySelector('.bc-expander-content')
            const firstDivSeriesInfo = seriesInfo.querySelector('div');
            const innerHtml = firstDivSeriesInfo.innerHTML;


            let seriesInfoHtml = innerHtml.toString();

            // Minimize the seriesInfoHtml (Strip chunks of whitespace)
            seriesInfoHtml = seriesInfoHtml.replace(/\s{2,}/g, ' ');

            let title = '';
            const container = html.querySelector('.bc-col-responsive');
            if (container) {
                const heading = container.querySelector('.bc-heading');
                if (heading) {
                    title = heading.textContent || heading.innerText || '';
                    title = title.replace(/\n/g, '').trim();
                }
            }


            return {
                asin: asin,
                title: title,
                description: seriesInfoHtml.length > 0 ? seriesInfoHtml.trim() : undefined
            };
        } else if(response.status >= 500) {
            throw new Error("Failed to fetch series data");
        }
        return undefined;
    } catch (e) {
        console.error(e);
        throw new Error("Failed to fetch series data");
    }
}