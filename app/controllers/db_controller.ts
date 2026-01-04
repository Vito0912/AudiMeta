// import type { HttpContext } from '@adonisjs/core/http'

import { ApiOperation, ApiQuery } from '@foadonis/openapi/decorators'
import {
  cacheApiQuery,
  limitApiQuery,
  notFoundApiResponse,
  pageApiQuery,
  successApiResponse,
} from '#config/openapi'
import Book from '#models/book'
import NotFoundException from '#exceptions/not_found_exception'
import BookDto from '#dtos/book'
import { dbBookSearchValidator } from '#validators/search'
import { HttpContext } from '@adonisjs/core/http'

export default class DbController {
  @ApiOperation({
    summary: 'Get books from DB',
    description:
      'This endpoint allows you to query the database for books, without any need to makeing a request to Audible. Thus this only returns books indexed in the database. All books that where fetched as part of search, series etc. are stored in the database and can be queried here. This is useful for debugging or to get a list of all books in the database.',
    operationId: 'getDBBooks',
  })
  @cacheApiQuery()
  @limitApiQuery()
  @ApiQuery({
    name: 'page',
    description: 'The page number to return. Defaults to 0.',
    type: 'integer',
    example: 1,
    required: false,
    schema: {
      type: 'integer',
      default: 1,
      minimum: 1,
    },
  })
  @ApiQuery({
    name: 'is_buyable',
    description: 'Filter books by buyable status',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'is_listenable',
    description: 'Filter books by listenable status',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'content_delivery_type',
    description: 'Filter books by content type delivery type',
    enum: [
      'AudioPart',
      'BookSeries',
      'Bundle',
      'MultiPartBook',
      'Periodical',
      'PodcastEpisode',
      'PodcastParent',
      'PodcastSeason',
      'SinglePartBook',
      'SinglePartIssue',
      'Subscription',
    ],
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'content_type',
    description: 'Filter books by content type',
    enum: [
      'Article',
      'Book',
      'Episode',
      'Excerpt',
      'Hypnosis',
      'Language Learning',
      'Lecture',
      'Meditation',
      'Misc',
      'Newspaper / Magazine',
      'Performance',
      'Periodical',
      'Podcast',
      'Product',
      'Radio/TV Program',
      'Sermon',
      'Show',
      'Speech',
      'Walking Tour',
    ],
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'book_format',
    description: 'Filter books by format',
    enum: ['unabridged', 'abridged', 'original_recording', 'highlights'],
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'has_pdf',
    description: 'Filter books by PDF availability',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'whisper_sync',
    description: 'Filter books by whisper sync availability',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'explicit',
    description: 'Filter books by explicit content',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'shorter_than',
    description: 'Filter books by duration, shorter than this value in minutes',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'longer_than',
    description: 'Filter books by duration, longer than this value in minutes',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'rating_better_than',
    description: 'Filter books by rating',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'rating_worse_than',
    description: 'Filter books by rating',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'language',
    description: 'Filter books by language. Should be english, german etc.',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'isbn',
    description: 'Search for books by ISBN',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'copyright',
    description: 'Search for books by copyright',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'publisher',
    description: 'Search for books by publisher',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'summary',
    description: 'Search for books by summary',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'description',
    description: 'Search for books by description',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'region',
    description: 'Filter books by region',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'subtitle',
    description: 'Search for books by subtitle',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'title',
    description: 'Search for books by title',
    required: false,
    type: 'string',
  })
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async book({ request }: HttpContext) {
    const payload = await dbBookSearchValidator.validate({ ...request.qs(), ...request.params() })

    const isEmptyPayload = Object.keys(payload).length <= 2
    if (isEmptyPayload) {
      throw new NotFoundException('No search parameters provided')
    }

    const books = await Book.query()
      .where((q) => {
        if (payload.title) q.whereILike('title', `%${payload.title}%`)
        if (payload.subtitle) q.whereILike('subtitle', `%${payload.subtitle}%`)
        if (payload.region) q.where('region', payload.region)
        if (payload.description) q.whereILike('description', `%${payload.description}%`)
        if (payload.summary) q.whereILike('summary', `%${payload.summary}%`)
        if (payload.publisher) q.whereILike('publisher', `%${payload.publisher}%`)
        if (payload.copyright) q.whereILike('copyright', `%${payload.copyright}%`)
        if (payload.isbn) q.whereILike('isbn', `%${payload.isbn}%`)
        if (payload.language) q.where('language', payload.language)
        if (payload.rating_better_than) q.where('rating', '>=', payload.rating_better_than)
        if (payload.rating_worse_than) q.where('rating', '<=', payload.rating_worse_than)
        if (payload.longer_than) q.where('length_minutes', '>=', payload.longer_than)
        if (payload.shorter_than) q.where('length_minutes', '<=', payload.shorter_than)
        if (payload.explicit !== undefined) q.where('explicit', payload.explicit)
        if (payload.whisper_sync !== undefined) q.where('whisper_sync', payload.whisper_sync)
        if (payload.has_pdf !== undefined) q.where('has_pdf', payload.has_pdf)
        if (payload.book_format) q.where('book_format', payload.book_format)
        if (payload.content_type) q.where('content_type', payload.content_type)
        if (payload.content_delivery_type)
          q.where('content_delivery_type', payload.content_delivery_type)
        if (payload.is_listenable !== undefined) q.where('is_listenable', payload.is_listenable)
        if (payload.is_buyable !== undefined) q.where('is_buyable', payload.is_buyable)
      })
      .preload('narrators')
      .preload('genres')
      .preload('series', (q) => q.pivotColumns(['position']))
      .preload('authors')
      .limit(payload.limit ?? 20)
      .offset(((payload.page ?? 1) - 1) * (payload.limit ?? 20))

    if (!books) {
      throw new NotFoundException()
    }

    return BookDto.fromArray(books)
  }
}
