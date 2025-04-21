// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getAuthorsValidator, paginationValidator } from '#validators/common'
import { AuthorHelper } from '../helper/author.js'

export default class AuthorsController {
  async index({ request }: HttpContext) {
    const payload = await getAuthorsValidator.validate({ ...request.qs(), ...request.params() })

    return AuthorHelper.get(payload)
  }

  async books({ request }: HttpContext) {
    const payload = await paginationValidator.validate({ ...request.qs(), ...request.params() })

    return AuthorHelper.getBooksByAuthor(payload)
  }
}
