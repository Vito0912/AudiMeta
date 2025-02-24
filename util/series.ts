import {Book} from "@prisma/client";
import {prisma} from "../app";

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