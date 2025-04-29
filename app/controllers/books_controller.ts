// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, getBooksValidator, skuValidation } from '#validators/common'
import { BookHelper } from '../helper/book.js'
import BookDto from '#dtos/book'
import NotFoundException from '#exceptions/not_found_exception'
import { TrackContentDto } from '#dtos/track'
import Book from '#models/book'

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

    const books = await new BookHelper().getOrFetchBooks(asins, payload.region, payload.cache)

    if (books.length === 0) {
      throw new NotFoundException()
    }

    if (payload.asin) {
      return new BookDto(books[0])
    }
    return BookDto.fromArray(books)
  }

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
}
