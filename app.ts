import express = require('express');
import {Express} from "express";
import rateLimit, {RateLimitRequestHandler} from "express-rate-limit";
import {PrismaClient} from '@prisma/client';
import openapi = require('@wesleytodd/openapi');

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 4005;

export const HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Audible/3.0.0 Android/11',
}

export const oapi = openapi({
    openapi: '3.0.0',
    info: {
        title: 'AudiMeta API',
        description: 'API to retrieve information about Book, Series and Search',
        version: '1.0.2',
    },
    servers: [
        {
            url: 'https://audimeta.de/',
            description: 'Public Instance',
        },
    ],
})

export const app: Express = express();
app.use(express.json());
app.use(oapi);
app.set('trust proxy', 1)

const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000,
    limit: 150,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
})

// apply to all requests
console.log("limiter", limiter)
app.use(limiter)
app.set('env', 'production');

require('./util/validationMiddleware');

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
app.get('/ping', oapi.path({
    responses: {
        200: {
            description: 'Server reachable',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            reachable: { type: 'boolean' }
                        }
                    }
                }
            }
        }
    }
}),(req, res) => {
    res.send({reachable: true});
});


// Load all controllers
require('./controller/bookController');
require('./controller/searchController');
require('./controller/seriesController');
require('./controller/chapterController');
require('./controller/authorController');

app.use('/', oapi.swaggerui())

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});