// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, getBooksValidator, skuValidation } from '#validators/common'
import { BookHelper } from '../helper/book.js'
import BookDto from '#dtos/book'
import NotFoundException from '#exceptions/not_found_exception'
import { TrackContentDto } from '#dtos/track'
import Book from '#models/book'
import { ApiOperation, ApiQuery, ApiTags, ApiParam } from '@foadonis/openapi/decorators'
import {
  asinApiQuery,
  cacheApiQuery,
  notFoundApiResponse,
  regionApiQuery,
  successApiResponse,
} from '#config/openapi'

@ApiTags('Books')
export default class BooksController {
  @ApiOperation({
    summary: 'Get a book by ASIN',
    operationId: 'getBook',
  })
  @asinApiQuery(false)
  @ApiQuery({
    name: 'asins',
    description: 'A comma-separated list of ASINs to fetch multiple books at once.',
    type: 'string',
    required: false,
  })
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
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

    const books = await new BookHelper().getOrFetchBooks(asins, payload.region, payload.cache)

    if (books.length === 0) {
      throw new NotFoundException()
    }

    if (payload.asin) {
      return new BookDto(books[0])
    }
    return BookDto.fromArray(books)
  }

  @ApiOperation({
    summary: 'Get chapters of a book by ASIN',
    operationId: 'getBookChapters',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: TrackContentDto })
  async chapters({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    const chapter = await new BookHelper().getOrFetchChapters(
      payload.asin,
      payload.region,
      payload.cache
    )

    if (!chapter) {
      throw new NotFoundException()
    }

    return new TrackContentDto(chapter.chapters)
  }

  @ApiOperation({
    summary: 'Get all books with a specific SKU',
    description:
      'This endpoint returns all books that share the same SKU group. This only queries the database, so it will only return books that are already in the database.',
    operationId: 'getBooksBySku',
  })
  @ApiParam({
    name: 'sku',
    description: 'The SKU group to search for.',
    type: 'string',
    required: true,
  })
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async sku({ request }: HttpContext) {
    const payload = await skuValidation.validate({ ...request.qs(), ...request.params() })

    if (/[A-Za-z]{2}$/.test(payload.sku)) {
      payload.sku = payload.sku.slice(0, -2)
    }

    const books = await Book.query()
      .where('sku_group', payload.sku)
      .preload('narrators')
      .preload('genres')
      .preload('series', (q) => q.pivotColumns(['position']))
      .preload('authors')
      .limit(20)

    if (!books) {
      throw new NotFoundException()
    }

    return BookDto.fromArray(books)
  }

  @ApiOperation({
    summary: 'Get a books in the same series',
    operationId: 'booksinsameseries',
  })
  @asinApiQuery(false)
  @regionApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async booksinsameseries({ request }: HttpContext) {
    const payload = await getBooksValidator.validate({ ...request.qs(), ...request.params() })

    let asin: string = ''

    if (payload.asin) {
      asin = payload.asin
    }else {
      return []
    }

    const books = await new BookHelper().getBooksInSameSeriesFromAudible(
      asin,
      payload.region
    )
    
    if (books===undefined ||books.length === 0) {
      throw new NotFoundException()
    }
    return BookDto.fromArray(books)
  }
}
