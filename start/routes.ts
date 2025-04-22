/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const SearchesController = () => import('#controllers/searches_controller')
const BooksController = () => import('#controllers/books_controller')
const AuthorsController = () => import('#controllers/authors_controller')

router.get('/ping', async () => {
  return {
    version: process.env.npm_package_version,
  }
})

// Book

router.get('/book', [BooksController, 'index'])
router.get('/book/:asin', [BooksController, 'index'])
router.get('/book/:asin/chapters', [BooksController, 'chapters'])

router.get('/search', [SearchesController, 'index'])

// Legacy route for backward compatibility
router.get('/chapters/:asin', [BooksController, 'chapters'])

// Author

router.get('/author', [AuthorsController, 'search'])

router.get('/author/:asin', [AuthorsController, 'index'])

router.get('/author/:asin/books', [AuthorsController, 'books'])
// Legacy route for backward compatibility
router.get('/author/books/:asin', [AuthorsController, 'books'])
