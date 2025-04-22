// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, getBooksValidator } from '#validators/common'
import { BookHelper } from '../helper/book.js'

export default class BooksController {
  async index({ request }: HttpContext) {
    const payload = await getBooksValidator.validate({ ...request.qs(), ...request.params() })

    const asins: string[] = []

    if (payload.asins) {
      asins.push(...payload.asins)
    } else if (payload.asin) {
      asins.push(payload.asin)
    }
    if (asins.length === 0) {
      return []
    }

    return new BookHelper().getOrFetchBooks(asins, payload.region, payload.cache)
  }

  async chapters({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    return new BookHelper().getOrFetchChapters(payload.asin, payload.region, payload.cache)
  }
}
