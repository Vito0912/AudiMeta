import {app, regionMap} from "../app";

app.use((req, res, next) => {

    // ASIN regex to validate ASIN
    const asinRegex = /^[A-Z0-9a-z]{10}$/;

    if (req.params.asin) {
        // Check if asin is 10 characters long
        if (req.params.asin.length !== 10 || !req.params.asin.match(asinRegex)) {
            res.status(400).send("Invalid ASIN");
            return;
        }
    }
    if (req.query.asins) {
        const asins = req.query.asins as string;
        // Check if asin is 10 characters long
        if (req.query.asins.length === 0 || asins.split(',').some((asin: string) => asin.length !== 10) || asins.split(',').some((asin: string) => !asin.match(asinRegex))) {
            res.status(400).send("One or more ASINs are invalid");
            return;
        }
    }
    if (req.query.region) {
        const region = req.query.region as string;
        if (!regionMap[region.toLowerCase()]) {
            res.status(400).send("Invalid region");
            return;
        }
    }
    if (req.query.limit) {
        const limit = parseInt(req.query.limit as string);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            res.status(400).send("Invalid limit");
            return;
        }
    }

    next()
})