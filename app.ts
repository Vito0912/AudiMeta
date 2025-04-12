if (process.env.SENTRY_DSN) require('./instrument.js');
import express = require('express');
import { Express } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./models/openAPI.json');
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';
import winston = require('winston');

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 4005;

export const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Audible/3.0.0 Android/11',
};

import Sentry = require('@sentry/node');
export const app: Express = express();
app.use(express.json());
app.set('trust proxy', 1);

const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// apply to all requests
console.log('limiter', limiter);
app.use(limiter);
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
  es: '.es',
  br: '.com.br',
};

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })],
});

// For now log also in production
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  })
);

app.get('/ping', (req, res) => {
  res.send({ reachable: true });
});

if (process.env.DATASET_NAME && process.env.AXIOM_API_TOKEN) {
  const datasetName = process.env.DATASET_NAME;
  const axiomsAPIToken = process.env.AXIOM_API_TOKEN;

  const allowedQueryParams = ['region', 'limit', 'page', 'title', 'subtitle', 'author', 'narrator', 'keywords', 'localTitle', 'localAuthor', 'localNarrator', 'localGenre', 'localSeries', 'localSeriesPosition', 'localIsbn', 'update', 'asin', 'asins', 'cache'];

  const requestLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new AxiomTransport({
        dataset: datasetName,
        token: axiomsAPIToken,
      }),
    ],
  });

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const ipAddress = req.headers['cf-connecting-ip'] || req.ip;

      const filteredQueryParams = {};
      Object.keys(req.query).forEach((key) => {
        if (allowedQueryParams.includes(key)) {
          filteredQueryParams[key] = req.query[key];
        }
      });

      void requestLogger.info({
        ip_address: ipAddress,
        query_parameters: filteredQueryParams,
        url: req.path,
        method: req.method,
        time_taken: duration,
        response_status: res.statusCode,
        user_agent: req.get('User-Agent')
      });
    });

    next();
  });
}



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redirect / to /api-docs SEO friendly
app.get('/', (req, res) => {
  res.redirect(301, '/api-docs');
});

// Load all controllers
require('./controller/bookController');
require('./controller/searchController');
require('./controller/seriesController');
require('./controller/chapterController');
require('./controller/authorController');

if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
  console.log('Server Listening on PORT:', PORT);
});
