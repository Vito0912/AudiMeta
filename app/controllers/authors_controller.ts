// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, paginationValidator, searchAuthorValidator } from '#validators/common'
import { AuthorHelper } from '../helper/author.js'
import BookDto from '#dtos/book'
import { AuthorDto } from '#dtos/author'
import NotFoundException from '#exceptions/not_found_exception'
import { ApiOperation, ApiTags } from '@foadonis/openapi/decorators'
import {
  asinApiQuery,
  cacheApiQuery,
  limitApiQuery,
  nameApiQuery,
  notFoundApiResponse,
  pageApiQuery,
  regionApiQuery,
  successApiResponse,
} from '#config/openapi'

@ApiTags('Authors')
export default class AuthorsController {
  @ApiOperation({
    summary: 'Get an author by ASIN',
    operationId: 'getAuthor',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: AuthorDto })
  async index({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    const author = await AuthorHelper.get(payload)

    if (!author) throw new NotFoundException()

    return new AuthorDto(author)
  }

  @ApiOperation({
    summary: 'Get books by author',
    description:
      'This gets a list of books by the author. Note that this list is not very accurate because Audible does not return all books for an author, but more just "popular" books. To search for all books by an author, use the search endpoint with an author supplied. This can include books of other authors though. Both endpoints are useful in different ways.',
    operationId: 'getBooksByAuthor',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @pageApiQuery()
  @limitApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async books({ request }: HttpContext) {
    const payload = await paginationValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await AuthorHelper.getBooksByAuthor(payload)) ?? [])
  }

  @ApiOperation({
    summary: 'Search for authors',
    description: 'This searches for authors by name using the Audible search API directly.',
    operationId: 'searchAuthors',
  })
  @nameApiQuery(true)
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [AuthorDto] })
  async search({ request }: HttpContext) {
    const payload = await searchAuthorValidator.validate({ ...request.qs(), ...request.params() })

    const authors = await AuthorHelper.search(payload)

    if (!authors || authors.length === 0) throw new NotFoundException()

    // @ts-ignore
    return AuthorDto.fromArray(authors)
  }
}
