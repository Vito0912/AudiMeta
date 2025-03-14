import { app, regionMap } from '../app';

app.use((req, res, next) => {
  if (req.query.asin) {
    if (!checkAsin(req.query.asin as string)) {
      res.status(400).send('Invalid ASIN');
      return;
    }
  }
  if (req.query.asins) {
    const asins = req.query.asins as string;
    if (req.query.asins.length === 0 || asins.split(',').some((asin: string) => !checkAsin(asin))) {
      res.status(400).send('One or more ASINs are invalid');
      return;
    }
  }
  if (req.query.region) {
    const regions = (req.query.region as string).split(',');
    if (regions.length === 0 || regions.length > 3) {
      res.status(400).send('Invalid number of regions');
      return;
    }
    if (regions.some((region: string) => !regionMap[region.toLowerCase()])) {
      res.status(400).send('One or more regions are invalid');
      return;
    }
    req.query.region = (req.query.region as string).toLowerCase();
  }
  if (req.query.limit) {
    const limit = parseInt(req.query.limit as string);
    if (isNaN(limit) || limit <= 0 || limit > 50) {
      res.status(400).send('Invalid limit');
      return;
    }
  }
  if (req.query.page) {
    const page = parseInt(req.query.page as string);
    if (isNaN(page) || page < 0) {
      res.status(400).send('Invalid page');
      return;
    }
  }
  if (req.query.update) {
    const update = req.query.update as string;
    if (update !== 'true' && update !== 'false') {
      res.status(400).send('Invalid update. Must be true or false');
      return;
    }
  }

  next();
});

export function checkAsin(asin: string): boolean {
  const asinRegex = /^[A-Z0-9a-z]{10}$/;
  return asin.length === 10 && asin.match(asinRegex) !== null;
}
