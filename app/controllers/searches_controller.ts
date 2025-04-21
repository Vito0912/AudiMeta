// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { basicSearchValidator } from '#validators/search'
import { SearchHelper } from '../helper/search.js'

export default class SearchesController {
  async index({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    return SearchHelper.search(payload)
  }
}
