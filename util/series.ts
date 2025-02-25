import {Book} from "@prisma/client";
import {HEADERS, prisma} from "../app";
import axios from "axios";
import {BookModel, mapBook} from "../models/type_model";

export async function getBooksInSeries(seriesAsin: string): Promise<BookModel[]> {
    console.log("Getting books in series", seriesAsin);
    const books = await prisma.book.findMany({
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
            authors: {
                include: {
                    author: true
                }
            },
            narrators: true,
            genres: true,
        },
    });

    if (books == null || books.length === 0) {
        return [];
    }

    return books.map(book => mapBook(book));
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