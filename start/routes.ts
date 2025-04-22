/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { extremeLimit, itemLimit, searchLimit } from '#start/limiter'

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

router.get('/book', [BooksController, 'index']).use(itemLimit)
router.get('/book/:asin', [BooksController, 'index']).use(itemLimit)
router.get('/book/:asin/chapters', [BooksController, 'chapters']).use(itemLimit)

router.get('/search', [SearchesController, 'index']).use(itemLimit).use(searchLimit)

// Legacy route for backward compatibility
router.get('/chapters/:asin', [BooksController, 'chapters']).use(itemLimit)

// Author

router.get('/author', [AuthorsController, 'search']).use(itemLimit)

router.get('/author/:asin', [AuthorsController, 'index']).use(itemLimit)

router.get('/author/:asin/books', [AuthorsController, 'books']).use(itemLimit).use(extremeLimit)
// Legacy route for backward compatibility
router.get('/author/books/:asin', [AuthorsController, 'books']).use(itemLimit).use(extremeLimit)

// Series
router.get('/series', [SeriesController, 'search']).use(itemLimit).use(searchLimit)

router.get('/series/:asin', [SeriesController, 'index']).use(itemLimit)

router.get('/series/:asin/books', [SeriesController, 'books']).use(itemLimit).use(extremeLimit)

// Legacy route for backward compatibility
router.get('/series/books/:asin', [SeriesController, 'books']).use(itemLimit).use(extremeLimit)

router.get(':region/search', [SearchesController, 'abs'])
