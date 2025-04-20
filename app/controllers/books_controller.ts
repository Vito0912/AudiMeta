// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBooksValidator } from '#validators/common'
import { BookHelper } from '../helper/book.js'

export default class BooksController {
  async index({ request }: HttpContext) {
    const payload = await request.validateUsing(getBooksValidator)

    console.log(payload)

    return new BookHelper().getOrFetchBooks(payload.asins, payload.region, payload.cache)
  }
}
