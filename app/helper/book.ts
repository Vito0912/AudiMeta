import Book from '#models/book'
import { Infer } from '@vinejs/vine/types'
import { regionValidation } from '#validators/common'
import { audibleHeaders, regionMap } from '#config/app'
import axios from 'axios'
import { DateTime } from 'luxon'
import Genre from '#models/genre'
import Series from '#models/series'
import Narrator from '#models/narrator'
import Author from '#models/author'
import { ModelObject } from '@adonisjs/lucid/types/model'

export class BookHelper {
  public async getOrFetchBooks(
    asins: string[],
    region: Infer<typeof regionValidation>,
    cache: boolean
  ) {
    const books: Book[] = await Book.query()
      .whereIn('asin', asins)
      .orderByRaw(
        `
        CASE asin
          ${asins.map((a, index) => `WHEN '${a}' THEN ${index + 1}`).join('\n      ')}
          ELSE ${asins.length + 1}
        END
        `
      )
      .preload('narrators')
      .preload('genres')
      .preload('series', (q) => q.pivotColumns(['position']))
      .preload('authors')

    const missingAsins = asins.filter((asin) => !books.some((book) => book.asin === asin))

    const fetchedBooks: Book[] = await this.getBooksFromAudible(
      missingAsins,
      region,
      cache ? books : []
    )

    if (cache) {
      return fetchedBooks
    } else {
      return [...books, ...fetchedBooks]
    }
  }

  private async getBooksFromAudible(
    asins: string[],
    region: Infer<typeof regionValidation>,
    updateBooks: Book[]
  ): Promise<Book[]> {
    if ((!asins || asins.length === 0) && updateBooks.length === 0) return []

    asins = [...asins, ...updateBooks.map((book) => book.asin)]

    const reqParams = {
      response_groups:
        'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
      asins: asins.join(','),
    }

    const url = `https://api.audible${regionMap[region]}/1.0/catalog/products/`

    const response = await axios.get(url, {
      headers: audibleHeaders,
      params: reqParams,
    })

    if (response.status === 200 && response.data !== undefined) {
      const json: any = response.data
      const products: any = json.products
      const books: Book[] = []
      const genres: Genre[] = []
      const authors: Author[] = []
      const narrators: Narrator[] = []
      const series: Series[] = []

      const genreMap: Map<string, Record<string, ModelObject>> = new Map()
      const authorMap: Map<string, Record<string, ModelObject>> = new Map()
      const seriesMap: Map<string, Record<string, ModelObject>> = new Map()
      const narratorMap: Map<string, Record<string, ModelObject>> = new Map()

      for (const product of products) {
        if (product.category_ladders) {
          const localGenres: Record<string, ModelObject> = {}
          for (const genreLadder of product.category_ladders) {
            for (const [index, genre] of genreLadder.ladder.entries()) {
              const genreModel: Genre = new Genre()

              genreModel.asin = genre.id
              genreModel.name = genre.name
              genreModel.type = index === 0 ? 'Genres' : 'Tags'

              genres.push(genreModel)
              localGenres[genreModel.asin] = {}
            }
          }
          genreMap.set(product.asin, localGenres)
        }
        if (product.narrators) {
          const localNarrators: Record<string, ModelObject> = {}
          for (const narrator of product.narrators) {
            const narratorModel = new Narrator()
            narratorModel.name = narrator.name.trim()
            narrators.push(narratorModel)
            localNarrators[narratorModel.name] = {}
          }
          narratorMap.set(product.asin, localNarrators)
        }
        if (product.authors) {
          const localAuthors: Record<string, ModelObject> = {}
          for (const author of product.authors) {
            const authorModel = new Author()
            authorModel.name = author.name.trim()
            authorModel.asin = author.asin ?? null
            authorModel.region = region
            authorModel.image = author.image ?? null
            authorModel.description = author.description ?? null

            authors.push(authorModel)
            localAuthors[`${authorModel.name}-${authorModel.region}-${authorModel.asin}`] = {}
          }
          authorMap.set(product.asin, localAuthors)
        }
        if (product.series) {
          const localSeries: Record<string, ModelObject> = {}
          for (const seriesData of product.series) {
            const seriesModel = new Series()
            seriesModel.asin = seriesData.asin
            seriesModel.title = seriesData.title.trim()
            seriesModel.description = seriesData.description ?? null

            if (seriesData.sequence && seriesData.sequence.length > 0) {
              localSeries[seriesData.asin] = { position: seriesData.sequence }
            } else {
              localSeries[seriesData.asin] = {}
            }
            series.push(seriesModel)
          }
          seriesMap.set(product.asin, localSeries)
        }
      }

      const results = await Promise.all([
        Genre.updateOrCreateMany(
          'asin',
          Array.from(new Map(genres.map((g) => [g.asin, g])).values()).map((g) => g.serialize()),
          {
            allowExtraProperties: true,
          }
        ),
        Author.updateOrCreateMany(
          ['asin', 'name', 'region'],
          Array.from(
            new Map(authors.map((a) => [`${a.asin}-${a.name}-${a.region}`, a])).values()
          ).map((a) => a.serialize()),
          { allowExtraProperties: true }
        ),
        Narrator.updateOrCreateMany(
          'name',
          Array.from(new Map(narrators.map((n) => [n.name, n])).values()).map((n) => n.serialize()),
          { allowExtraProperties: true }
        ),
        Series.updateOrCreateMany(
          'asin',
          Array.from(new Map(series.map((s) => [s.asin, s])).values()).map((s) => s.serialize()),
          { allowExtraProperties: true }
        ),
      ])

      const createdAuthors = results[1]

      for (const [asin, authorsRecord] of authorMap.entries()) {
        const authorIds: Record<string, ModelObject> = {}
        for (const key in authorsRecord) {
          // Expected key format: "name-region-asin"
          const parts = key.split('-')
          const authorName = parts[0]
          const authorRegion = parts[1]
          const authorAsin = parts[2]

          const author = createdAuthors.find(
            (a) =>
              a.name === authorName &&
              a.region === authorRegion &&
              (authorAsin !== 'null' ? a.asin === authorAsin : true)
          )

          if (author) {
            authorIds[author.id] = {}
          }
        }

        authorMap.set(asin, authorIds)
      }

      const promises: Promise<any>[] = []

      for (const product of products) {
        const book: Book = updateBooks.find((b) => b.asin === product.asin) ?? new Book()
        book.asin = product.asin
        book.region = region
        book.title = product.title
        book.subtitle = product.subtitle ?? null
        book.isbn = product.isbn ?? null
        book.copyright = product.copyright ?? null
        book.description = product.merchandising_summary ?? null
        book.summary = product.publisher_summary ?? null
        book.bookFormat = product.format_type ?? null
        book.publisher = product.publisher_name ?? null
        book.language = product.language ?? null
        book.rating = product.rating.overall_distribution.average_rating ?? null
        book.releaseDate = product.release_date ? DateTime.fromISO(product.release_date) : null
        book.explicit = product.is_adult_product ?? false
        book.hasPdf = product.is_pdf_url_available ?? false

        const imageMap = product.product_images
        if (imageMap && Object.keys(imageMap).length > 0) {
          const highestNumericKey = Object.keys(imageMap)
            .map(Number)
            .reduce((max, current) => Math.max(max, current), -Infinity)

          book.image = imageMap[highestNumericKey.toString()]
        }

        promises.push(
          book.save().then(async () => {
            await Promise.all([
              book.related('genres').sync(genreMap.get(product.asin) ?? {}),
              book.related('series').sync(seriesMap.get(product.asin) ?? {}),
              book.related('narrators').sync(narratorMap.get(product.asin) ?? {}),
              book.related('authors').sync(authorMap.get(product.asin) ?? {}),
            ])
          })
        )

        books.push(book)
      }

      await Promise.all(promises)

      if (books.length > 0) {
        return books
      }
    }

    throw new Error('Failed to fetch book data')
  }
}
