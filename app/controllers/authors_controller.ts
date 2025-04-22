// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, paginationValidator, searchAuthorValidator } from '#validators/common'
import { AuthorHelper } from '../helper/author.js'
import BookDto from '#dtos/book'
import { AuthorDto } from '#dtos/author'
import NotFoundException from '#exceptions/not_found_exception'

export default class AuthorsController {
  async index({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    const author = await AuthorHelper.get(payload)

    if (!author) throw new NotFoundException()

    return new AuthorDto(author)
  }

  async books({ request }: HttpContext) {
    const payload = await paginationValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await AuthorHelper.getBooksByAuthor(payload)) ?? [])
  }

  async search({ request }: HttpContext) {
    const payload = await searchAuthorValidator.validate({ ...request.qs(), ...request.params() })

    const authors = await AuthorHelper.search(payload)

    if (!authors || authors.length === 0) throw new NotFoundException()

    return AuthorDto.fromArray(authors)
  }
}
