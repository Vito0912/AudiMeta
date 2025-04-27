/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { cacheLimit, extremeLimit, itemLimit, searchLimit } from '#start/limiter'
import app from '@adonisjs/core/services/app'

const SearchesController = () => import('#controllers/searches_controller')
const BooksController = () => import('#controllers/books_controller')
const AuthorsController = () => import('#controllers/authors_controller')
const SeriesController = () => import('#controllers/series_controller')

router.get('/ping', async () => {
  return {
    version: process.env.npm_package_version,
  }
})

// Book

router.get('/book', [BooksController, 'index']).use(cacheLimit).use(itemLimit)
router.get('/book/:asin', [BooksController, 'index']).use(cacheLimit).use(itemLimit)
router.get('/book/:asin/chapters', [BooksController, 'chapters']).use(cacheLimit).use(itemLimit)

router.get('/search', [SearchesController, 'index']).use(cacheLimit).use(itemLimit).use(searchLimit)

// Legacy route for backward compatibility
router.get('/chapters/:asin', [BooksController, 'chapters']).use(cacheLimit).use(itemLimit)

// Author

router.get('/author', [AuthorsController, 'search']).use(cacheLimit).use(itemLimit)

router.get('/author/:asin', [AuthorsController, 'index']).use(cacheLimit).use(itemLimit)

router
  .get('/author/:asin/books', [AuthorsController, 'books'])
  .use(cacheLimit)
  .use(itemLimit)
  .use(extremeLimit)
// Legacy route for backward compatibility
router
  .get('/author/books/:asin', [AuthorsController, 'books'])
  .use(cacheLimit)
  .use(itemLimit)
  .use(extremeLimit)

// Series
router.get('/series', [SeriesController, 'search']).use(cacheLimit).use(itemLimit).use(searchLimit)

router.get('/series/:asin', [SeriesController, 'index']).use(cacheLimit).use(itemLimit)

router
  .get('/series/:asin/books', [SeriesController, 'books'])
  .use(cacheLimit)
  .use(itemLimit)
  .use(extremeLimit)

// Legacy route for backward compatibility
router
  .get('/series/books/:asin', [SeriesController, 'books'])
  .use(cacheLimit)
  .use(itemLimit)
  .use(extremeLimit)

router.get(':region/search', [SearchesController, 'abs']).use(cacheLimit).use(searchLimit)

router.get('/openapi.json', async (ctx) => {
  const filePath = app.makePath('openapi.json')
  return ctx.response.download(filePath, true)
})

router.get('/api-docs', async (ctx) => {
  ctx.response.send(`<!DOCTYPE html>
		<html lang="en">
		<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="X-UA-Compatible" content="ie=edge">
				<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.21.0/swagger-ui-standalone-preset.js"></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.21.0/swagger-ui-bundle.js"></script>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.21.0/swagger-ui.css" />
				<title>Documentation</title>
		</head>
		<body>
				<div id="swagger-ui"></div>
				<script>
						window.onload = function() {
							SwaggerUIBundle({
								url: "./openapi.json",
								dom_id: '#swagger-ui',
								presets: [
									SwaggerUIBundle.presets.apis,
									SwaggerUIStandalonePreset
								],
								layout: "StandaloneLayout"
							})
						}
				</script>
<style>
  body, div {
    padding: 0;
    margin: 0;
  }
</style>
		</body>
		</html>`)
})
