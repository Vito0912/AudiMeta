// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import {
  basicSearchValidator,
  quickSearchValidator,
  absQuickSearchValidator,
} from '#validators/search'
import { SearchHelper } from '../helper/search.js'
import BookDto, { AbsBookDto } from '#dtos/book'
import NotFoundException from '#exceptions/not_found_exception'
import { ApiOperation, ApiQuery, ApiExcludeOperation, ApiTags } from '@foadonis/openapi/decorators'
import {
  cacheApiQuery,
  limitApiQuery,
  notFoundApiResponse,
  pageApiQuery,
  regionApiQuery,
  successApiResponse,
} from '#config/openapi'

@ApiTags('Books')
export default class SearchesController {
  @ApiOperation({
    summary: 'Search for books',
    operationId: 'searchBooks',
  })
  @regionApiQuery()
  @ApiQuery({
    name: 'keywords',
    description: 'Keywords to search for in the book.',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'query',
    description: 'A general query to search for.',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'author',
    description: 'The author to search for.',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'narrator',
    description: 'The narrator of the book.',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'publisher',
    description: 'The publisher of the book.',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'title',
    description: 'The title of the book.',
    type: 'string',
    required: false,
  })
  @limitApiQuery()
  @pageApiQuery()
  @cacheApiQuery()
  @ApiQuery({
    name: 'products_sort_by',
    description: 'The sort order of the products. Defaults to "Relevance".',
    type: 'string',
    enum: [
      '-ReleaseDate',
      'ContentLevel',
      '-Title',
      'AmazonEnglish',
      'AvgRating',
      'BestSellers',
      '-RuntimeLength',
      'ReleaseDate',
      'ProductSiteLaunchDate',
      '-ContentLevel',
      'Title',
      'Relevance',
      'RuntimeLength',
    ],
  })
  @notFoundApiResponse()
  @successApiResponse({ type: BookDto })
  async index({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    const books = (await SearchHelper.search(payload)) ?? []

    if (!books || books.length === 0) {
      throw new NotFoundException()
    }

    return BookDto.fromArray(books)
  }

  @ApiExcludeOperation()
  async abs({ request }: HttpContext) {
    const payload = await basicSearchValidator.validate({ ...request.qs(), ...request.params() })

    if (payload.query && !payload.title) {
      payload.title = payload.query
    }

    payload.limit = 5

    const books = (await SearchHelper.search(payload)) ?? []

    if (!books || books.length === 0) {
      throw new NotFoundException()
    }

    return { matches: AbsBookDto.fromArray(books) }
  }

  @ApiOperation({
    summary: 'Quick search for books',
    operationId: 'quickSearchBooks',
    description:
      'This endpoint returns lower quality search results, but can return books subject to region locking which would not be findable via the search endpoint due to the server location.',
  })
  @regionApiQuery()
  @ApiQuery({
    name: 'keywords',
    description: 'Keywords to search for.',
    type: 'string',
    required: true,
  })
  @notFoundApiResponse()
  @successApiResponse({ type: BookDto })
  async quickSearch({ request }: HttpContext) {
    const payload = await quickSearchValidator.validate({ ...request.qs(), ...request.params() })

    const books = (await SearchHelper.quickSearch(payload)) ?? []

    if (!books || books.length === 0) {
      throw new NotFoundException()
    }

    return BookDto.fromArray(books)
  }

  @ApiExcludeOperation()
  async absQuickSearch({ request }: HttpContext) {
    const payload = await absQuickSearchValidator.validate({
      ...request.qs(),
      ...request.params(),
    })

    let keywords = payload.query || payload.title

    if (!keywords) {
      throw new NotFoundException()
    }

    const books = (await SearchHelper.quickSearch({ keywords, region: payload.region })) ?? []

    if (!books || books.length === 0) {
      throw new NotFoundException()
    }

    return { matches: AbsBookDto.fromArray(books) }
  }
}
