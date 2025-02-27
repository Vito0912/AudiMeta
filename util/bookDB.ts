import {BookInput, BookInputFactory, getFullBooks, insertBook, insertBooks} from "./book";
import axios from "axios";
import {HEADERS, regionMap} from "../app";
import {BookModel} from "../models/type_model";

export async function getBook(asin: string, region: string, req: any, cache: string | undefined): Promise<BookModel> {

    if(!cache || cache !== 'false') {
        const bookResult: BookModel = (await getFullBooks(asin, region)) as BookModel;

        if (bookResult) {
            return bookResult;
        }
    } else {
        console.log("Cache disabled for book", asin);
    }

    const reqParams = {
        'response_groups': 'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders'
    }

    const url = `https://api.audible${regionMap[region]}/1.0/catalog/products/`;

    const response = await axios.get(url + req.params.asin, {
        headers: HEADERS,
        params: reqParams
    });

    if (response.status === 200 && response.data !== undefined) {
        const json: any = response.data;

        const parsedBook: BookInput = BookInputFactory.fromAudibleDate(json.product, region.toUpperCase())

        if(parsedBook === undefined) {
            throw new Error("Book not found");
        }

        await insertBook(parsedBook);

        console.log("Added book", parsedBook.asin);

        return await getFullBooks(asin, region) as BookModel;
    }

    throw new Error("Failed to fetch book data");
}

export async function getBooks(asins: string[], region: string, req: any, limit?: number, page?: number): Promise<BookModel[]> {

    if (limit && page) {
        asins = asins.slice(page * limit, (page + 1) * limit);
    }

    let bookResults: BookModel[] = await getFullBooks(asins, region) as BookModel[];

    let foundAsins: string[] = [];

    if (bookResults) {
        if (bookResults.length === asins.length) {
            return asins.map(asin => bookResults.find(book => book.asin === asin));
        } else {
            foundAsins = bookResults.map(book => book.asin);
        }
    }

    const notFoundAsins = asins.filter(asin => !foundAsins.includes(asin));

    if (notFoundAsins.length === 0) {
        console.log(bookResults.length, asins.length);
        return asins.map(asin => bookResults.find(book => book.asin === asin));
    }

    const reqParams = {
        'response_groups': 'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
        'asins': notFoundAsins.join(',')
    }

    const url = `https://api.audible${regionMap[region]}/1.0/catalog/products`;

    const response = await axios.get(url, {
        headers: HEADERS,
        params: reqParams
    });

    if (response.status === 200) {
        const json: any = response.data;

        let parsedBooksList: BookInput[] = [];
        for (const product of json.products) {
            const parsedBook: BookInput = BookInputFactory.fromAudibleDate(product, region.toUpperCase())

            if(parsedBook !== undefined) {
                parsedBooksList.push(parsedBook);
                console.log("Added book", parsedBook.asin);
            }
        }
        await insertBooks(parsedBooksList);

        const allBooks: BookModel[] = [...bookResults, ...(await getFullBooks(notFoundAsins, region) as BookModel[])];

        return asins.map(asin => allBooks.find(book => book.asin === asin)).filter(book => book !== undefined);
    }

    throw new Error("Failed to fetch book data");
}