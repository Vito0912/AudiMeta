import {app, regionMap} from "../app";
import {getBook, getBooks} from "../util/bookDB";

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 */
app.get('/book/:asin', async (req, res) => {
    const asin: string = req.params.asin;

    if (!asin) {
        res.status(400).send("No asin provided");
        return;
    }

    const region: string = (req.query.region || 'US').toString().toLowerCase();
    const cache: string = req.query.cache as string;

    try {
        const book = await getBook(asin, region, req, cache);
        if (!book) {
            res.status(404).send("Book not found");
            return;
        }
        res.send(book);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error');
    }
});

/**
 * Returns all books that match the asin and caches them in the database
 * If the book is not in the database then region is important
 *
 * @param asins - The asins of the books separated by commas
 */
app.get('/book', async (req, res) => {
    const asinsQuery: string = req.query.asins as string;
    const region: string = (req.query.region || 'US').toString().toLowerCase();

    if(!asinsQuery) {
         res.status(400).send("No asins provided");
        return
    }

    const asins = asinsQuery.split(',');
    if (asins.length === 0) {
         res.status(400).send("No asins provided");
        return
    } else if (asins.length > 50) {
         res.status(400).send("Too many asins provided");
        return
    }

    if (!regionMap[region.toLowerCase()]) {
         res.status(400).send("Invalid region");
        return
    }

    try {
        const books = await getBooks(asins, region, req);

        if (!books || books.length === 0) {
             res.status(404).send("No books found");
            return
        }

        res.send(books);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error')
    }
});