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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('/book', [BooksController, 'index'])
router.get('/book/:asin', [BooksController, 'index'])

router.get('/search', [SearchesController, 'index'])
