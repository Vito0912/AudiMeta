// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, getBooksValidator } from '#validators/common'
import { BookHelper } from '../helper/book.js'
import BookDto from '#dtos/book'
import NotFoundException from '#exceptions/not_found_exception'
import { TrackContentDto } from '#dtos/track'

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
    console.log(typeof chapter.chapters)

    return new TrackContentDto(chapter.chapters)
  }
}
