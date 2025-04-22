// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { basicSearchValidator } from '#validators/search'
import { SearchHelper } from '../helper/search.js'
import BookDto, { AbsBookDto } from '#dtos/book'

export default class SearchesController {
  async index({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await SearchHelper.search(payload)) ?? [])
  }

  async abs({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    if (payload.query && !payload.title) {
      payload.title = payload.query
    }

    payload.limit = 5

    return { matches: AbsBookDto.fromArray((await SearchHelper.search(payload)) ?? []) }
  }
}
