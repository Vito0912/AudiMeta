import {Book} from "@prisma/client";
import {HEADERS, prisma} from "../app";
import axios from "axios";

export async function getBooksInSeries(seriesAsin: string): Promise<Book[]> {
    console.log("Getting books in series", seriesAsin);
    return prisma.book.findMany({
        where: {
            series: {
                some: {
                    series: {
                        asin: seriesAsin,
                    },
                },
            },
        },
        include: {
            series: {
                include: {
                    series: true,
                },
            },
            authors: true,
            narrators: true,
            genres: true,
        },
    });
}

export async function getSeriesAsins(asin: string): Promise<string[]> {
    const URL = `https://api.audible.de/1.0/catalog/products/${asin}`

    const response = await axios.get(URL, {
        headers: HEADERS,
        params: {'response_groups': 'relationships'}
    });

    if (response.status === 200) {
        const json: any = response.data;
        return json.product.relationships.map((series: any) => series.asin);
    }
}