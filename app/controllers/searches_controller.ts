// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { basicSearchValidator } from '#validators/search'
import { SearchHelper } from '../helper/search.js'
import BookDto, { AbsBookDto } from '#dtos/book'
import NotFoundException from '#exceptions/not_found_exception'

export default class SearchesController {
  async index({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    const books = (await SearchHelper.search(payload)) ?? []

    if (!books || books.length === 0) {
      return new NotFoundException()
    }

    return BookDto.fromArray(books)
  }

  async abs({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    if (payload.query && !payload.title) {
      payload.title = payload.query
    }

    payload.limit = 5

    const books = (await SearchHelper.search(payload)) ?? []

    if (!books || books.length === 0) {
      return new NotFoundException()
    }

    return { matches: AbsBookDto.fromArray(books) }
  }
}
