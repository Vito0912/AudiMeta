import express = require('express');
import {Express} from "express";
import rateLimit, {RateLimitRequestHandler} from "express-rate-limit";
import {PrismaClient} from '@prisma/client';

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 4005;

export const HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Audible/3.0.0 Android/11',
}


export const app: Express = express();
app.use(express.json());

const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
})

// apply to all requests
console.log("limiter", limiter)
app.use(limiter)


export const regionMap = {
    us: '.com',
    ca: '.ca',
    uk: '.co.uk',
    au: '.com.au',
    fr: '.fr',
    de: '.de',
    jp: '.co.jp',
    it: '.it',
    in: '.in',
    es: '.es'
}


/**
 * @swagger
 * /ping:
 *
 */
app.get('/ping', (req, res) => {
    res.send('pong');
});


// Load all controllers
require('./controller/bookController');
require('./controller/searchController');



app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});