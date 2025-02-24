import {getBooksInSeries} from "../util/series";
import {app} from "../app";

/**
 * Returns all books in a series
 */
// @ts-ignore
app.get('/series/:asin', async (req, res) => {
    return res.send(await getBooksInSeries(req.params.asin))
});