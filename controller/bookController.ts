import {app, regionMap} from "../app";
import {getBook, getBooks} from "../util/bookDB";

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 */
// @ts-ignore
app.get('/book/:asin', async (req, res) => {
    const asin: string = req.params.asin;
    const region: string = (req.query.region || 'US').toString();

    if (!regionMap[region.toLowerCase()]) {
        return res.status(400).send("Invalid region");
    }

    try {
        const book = await getBook(asin, region, req);
        res.send(book);
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
});

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 *
 * @param asins - The asins of the books separated by commas
 */
// @ts-ignore
app.get('/book', async (req, res) => {
    const asinsQuery: string = req.query.asins as string;
    const region: string = (req.query.region || 'US').toString();

    if(!asinsQuery) {
        return res.status(400).send("No asins provided");
    }

    const asins = asinsQuery.split(',');
    if (asins.length === 0) {
        return res.status(400).send("No asins provided");
    } else if (asins.length > 20) {
        return res.status(400).send("Too many asins provided");
    }

    if (!regionMap[region.toLowerCase()]) {
        return res.status(400).send("Invalid region");
    }

    try {
        const books = await getBooks(asins, region, req);
        res.send(books);
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
});