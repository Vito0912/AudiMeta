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
import { HttpContext } from '@adonisjs/core/http'
import retryOnUniqueViolation from './parallel_helper.js'
import Track from '#models/track'
import NotFoundException from '#exceptions/not_found_exception'

function filterNulls(obj: ModelObject | ArrayLike<unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null))
}

export class BookHelper {
  public async getOrFetchBooks(
    asins: string[],
    region: Infer<typeof regionValidation>,
    cache: boolean,
    sortByEpisode: boolean = false
  ): Promise<Book[]> {
    const startTime = DateTime.now()
    const ctx = HttpContext.get()

    const books: Book[] = await Book.query()
      .whereIn('asin', asins)
      .preload('narrators')
      .preload('genres')
      .preload('series', (q) => q.pivotColumns(['position']))
      .preload('authors')

    if (ctx)
      void ctx.logger.info({
        message: `Fetched ${books.length} books from the database`,
        db_num: asins.length,
        db_got: books.length,
        db_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    const missingAsins = asins.filter((asin) => !books.some((book) => book.asin === asin))

    const mergedAsins = Array.from(
      new Set([...missingAsins, ...(cache ? [] : books.map((book) => book.asin))])
    )

    const splitted50Chunks = []
    for (let i = 0; i < mergedAsins.length; i += 50) {
      splitted50Chunks.push(mergedAsins.slice(i, i + 50))
    }

    const fetchedBooks = await Promise.all(
      splitted50Chunks.map(
        (chunk, index) =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(this.getBooksFromAudible(chunk, region, cache ? [] : books)),
              index * 250
            )
          )
      )
    ).then((results) => results.flat())

    const compareByEpisode = (a: Book, b: Book) => {
      const aEpisode = a.episodeNumber ? Number.parseFloat(a.episodeNumber) : Infinity
      const bEpisode = b.episodeNumber ? Number.parseFloat(b.episodeNumber) : Infinity
      return aEpisode - bEpisode || asins.indexOf(a.asin) - asins.indexOf(b.asin)
    }

    const compareByAsinOrder = (a: Book, b: Book) => asins.indexOf(a.asin) - asins.indexOf(b.asin)

    const booksToSort: Book[] = (cache ? [...books, ...fetchedBooks] : fetchedBooks) as Book[]

    const compareFunc = sortByEpisode ? compareByEpisode : compareByAsinOrder

    return booksToSort.sort(compareFunc)
  }

  private async getBooksFromAudible(
    asins: string[],
    region: Infer<typeof regionValidation>,
    updateBooks: Book[]
  ): Promise<Book[]> {
    if ((!asins || asins.length === 0) && updateBooks.length === 0) return []

    const ctx = HttpContext.get()

    asins = Array.from(new Set([...asins, ...updateBooks.map((book) => book.asin)]))

    const startTime = DateTime.now()

    const reqParams = {
      response_groups:
        'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
      ...(asins.length > 1 ? { asins: asins.join(',') } : {}),
      image_sizes: '500,1000,2400,3200',
    }

    const url =
      `https://api.audible${regionMap[region]}/1.0/catalog/products/` +
      (asins.length === 1 ? String(asins[0]) : '')

    const response = await axios.get(url, {
      headers: audibleHeaders,
      params: reqParams,
    })

    if (ctx)
      void ctx.logger.info({
        message: `Requested ${asins.length} books from Audible`,
        requested_num: asins.length,
        requested_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (response.status === 200 && response.data !== undefined) {
      const json: any = response.data
      const products: any = (json.products ?? [json.product]).filter(
        (product: { title: string | null; publication_datetime: string | null }) =>
          product.title &&
          product.publication_datetime &&
          product.publication_datetime !== '2200-01-01T00:00:00Z'
      )

      if (products.length <= 0) throw new NotFoundException()

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

              genreModel.asin = genre.id?.trim() ?? null
              genreModel.name = genre.name?.trim() ?? null
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
            authorModel.name = author.name?.replace('\t', '').trim() ?? null
            authorModel.asin = author.asin?.replace('\t', '').trim() ?? null
            authorModel.region = region
            authorModel.image = author.image ?? null
            authorModel.description = author.description ?? null

            authors.push(authorModel)
            localAuthors[`${authorModel.name}-${authorModel.region}-${authorModel.asin}`] = {}
          }
          authorMap.set(product.asin, localAuthors)
        }
        const localSeries: Record<string, ModelObject> = {}
        if (product.series) {
          for (const seriesData of product.series) {
            const seriesModel = new Series()
            seriesModel.asin = seriesData.asin ? seriesData.asin.replace('\t', '').trim() : null
            seriesModel.title = seriesData.title ? seriesData.title.replace('\t', '').trim() : null
            seriesModel.description = seriesData.description ?? null

            if (seriesData.sequence && seriesData.sequence.length > 0) {
              localSeries[seriesData.asin] = { position: seriesData.sequence }
            } else {
              localSeries[seriesData.asin] = {}
            }
            series.push(seriesModel)
          }
        }
        if (product.content_type && product.content_type.toLowerCase() === 'podcast') {
          for (const seriesData of product.relationships) {
            if (seriesData.asin && seriesData.title) {
              const seriesModel = new Series()
              seriesModel.asin = seriesData.asin ? seriesData.asin.replace('\t', '').trim() : null
              seriesModel.title = seriesData.title
                ? seriesData.title.replace('\t', '').trim()
                : null

              if (seriesData.sort && seriesData.sort.length > 0) {
                localSeries[seriesData.asin] = { position: seriesData.sort }
              } else {
                localSeries[seriesData.asin] = {}
              }
              series.push(seriesModel)
            }
          }
        }
        if (localSeries && Object.keys(localSeries).length > 0) {
          seriesMap.set(product.asin, localSeries)
        }
      }

      const [authorsWithAsin, authorsWithoutAsin] = authors.reduce(
        (acc, author) => {
          const key = `${author.asin ?? 'null'}-${author.name}-${author.region}`
          if (author.asin) {
            if (!acc[0].some((a) => `${a.asin}-${a.name}-${a.region}` === key)) {
              acc[0].push(author)
            }
          } else {
            if (!acc[1].some((a) => `${a.asin}-${a.name}-${a.region}` === key)) {
              acc[1].push(author)
            }
          }
          return acc
        },
        [[], []] as [Author[], Author[]]
      )

      const results = await retryOnUniqueViolation(async () => {
        return await Promise.all([
          Genre.updateOrCreateMany(
            'asin',
            Array.from(new Map(genres.map((g) => [g.asin, g])).values()).map((g) =>
              filterNulls(g.serialize())
            ),
            {
              allowExtraProperties: true,
            }
          ),
          Author.updateOrCreateMany(
            ['asin', 'name', 'region'],
            Array.from(
              new Map(authorsWithAsin.map((a) => [`${a.asin}-${a.name}-${a.region}`, a])).values()
            ).map((a) => filterNulls(a.serialize())),
            { allowExtraProperties: true }
          ),
          Author.updateOrCreateMany(
            ['name', 'region'],
            Array.from(
              new Map(
                authorsWithoutAsin.map((a) => [`${a.asin}-${a.name}-${a.region}`, a])
              ).values()
            ).map((a) => filterNulls(a.serialize())),
            { allowExtraProperties: true }
          ),
          Narrator.updateOrCreateMany(
            'name',
            Array.from(new Map(narrators.map((n) => [n.name, n])).values()).map((n) =>
              filterNulls(n.serialize())
            ),
            { allowExtraProperties: true }
          ),
          Series.updateOrCreateMany(
            'asin',
            Array.from(new Map(series.map((s) => [s.asin, s])).values()).map((s) =>
              filterNulls(s.serialize())
            ),
            { allowExtraProperties: true }
          ),
        ])
      })

      const createdAuthors = [...results[1], ...results[2]]

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
        book.asin = product.asin?.replace('\t', '').trim() ?? null
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
        book.lengthMinutes = product.runtime_length_min ?? null
        book.whisperSync = product.read_along_support ?? false
        book.contentType = product.content_type ?? null
        book.contentDeliveryType = product.content_delivery_type ?? null
        book.episodeNumber = product.episode_number ? String(product.episode_number) : null
        book.episodeType = product.episode_type ?? null
        book.sku = product.sku ?? null
        book.skuGroup = product.sku_lite ?? null

        const imageMap = product.product_images
        if (imageMap && Object.keys(imageMap).length > 0) {
          const highestNumericKey = Object.keys(imageMap)
            .map(Number)
            .reduce((max, current) => Math.max(max, current), -Infinity)

          book.image = imageMap[highestNumericKey.toString()]?.replace(/\._\w+_/g, '') ?? null
        }

        const asin = product.asin

        promises.push(
          retryOnUniqueViolation(async () => {
            return await Book.updateOrCreate({ asin: book.asin }, filterNulls(book.serialize()), {
              allowExtraProperties: true,
            }).then(async () => {
              await Promise.all([
                book.related('genres').sync(genreMap.get(product.asin) ?? {}),
                book.related('series').sync(seriesMap.get(product.asin) ?? {}),
                book.related('narrators').sync(narratorMap.get(product.asin) ?? {}),
                book.related('authors').sync(authorMap.get(product.asin) ?? {}),
              ])
            })
          })
        )

        if (genreMap.has(asin)) {
          const genreAsins = [...new Set(Object.keys(genreMap.get(asin)!))]
          const bookGenres = genreAsins
            .map((key) => genres.find((g) => String(g.asin) === key))
            .filter(Boolean)
            .filter((n) => n !== undefined)
          // @ts-ignore
          book.$setRelated('genres', bookGenres)
        }

        if (authorMap.has(asin)) {
          const authorIds = [...new Set(Object.keys(authorMap.get(asin)!))] as unknown as number[]
          const bookAuthors = authorIds
            .map((id) => createdAuthors.find((a) => String(a.id) === String(id)))
            .filter(Boolean)
            .filter((n) => n !== undefined)
          // @ts-ignore
          book.$setRelated('authors', bookAuthors)
        }

        if (narratorMap.has(asin)) {
          const narratorNames = [...new Set(Object.keys(narratorMap.get(asin)!))]
          const bookNarrators = narratorNames
            .map((name) => narrators.find((n) => n.name === name))
            .filter(Boolean)
            .filter((n) => n !== undefined)
          // @ts-ignore
          book.$setRelated('narrators', bookNarrators)
        }

        if (seriesMap.has(asin)) {
          const seriesObj = seriesMap.get(asin)!
          const seriesAsins = [...new Set(Object.keys(seriesObj))]

          const bookSeries = seriesAsins
            .map((asinKey) => {
              const original = series.find((s) => s.asin === asinKey)
              if (!original) return null
              const clone = Object.create(Object.getPrototypeOf(original))
              Object.assign(clone, original)
              clone.$extras = { ...(original.$extras || {}) }
              return clone
            })
            .filter(Boolean)

          for (const [i, seriesAsin] of seriesAsins.entries()) {
            const position = seriesObj[seriesAsin].position ?? null
            if (position !== null) {
              bookSeries[i].$extras.pivot_position = position
            }
          }
          // @ts-ignore
          book.$setRelated('series', bookSeries)
        }

        books.push(book)
      }

      await Promise.all(promises)

      if (books.length > 0) {
        return books
      }
    }

    throw new Error('Failed to fetch book data')
  }

  public async getOrFetchChapters(
    asin: string,
    region: Infer<typeof regionValidation>,
    cache: boolean
  ) {
    let startTime = DateTime.now()
    const ctx = HttpContext.get()

    let track: Track | null = await Track.query().where('asin', asin).first()

    if (ctx && track)
      void ctx.logger.info({
        message: `Fetched chapters from the database`,
        db_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (track && cache) {
      return track
    }
    if (!track) track = new Track()

    startTime = DateTime.now()

    const reqParams = {
      response_groups: 'chapter_info, always-returned, content_reference, content_url',
      quality: 'High',
    }

    const url = `https://api.audible${regionMap[region]}/1.0/content/` + asin + '/metadata'

    const response = await axios.get(url, {
      headers: audibleHeaders,
      params: reqParams,
    })

    if (ctx)
      void ctx.logger.info({
        message: `Requested chapters from Audible`,
        chapters_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (response.status === 200 && response.data !== undefined) {
      if (response.data?.content_metadata?.chapter_info) {
        track.chapters = response.data.content_metadata.chapter_info
      } else {
        throw new NotFoundException()
      }
    }

    const book = await Book.query().where('asin', asin).first()

    if (!book) {
      await retryOnUniqueViolation(async () => {
        return await new BookHelper().getOrFetchBooks([asin], region, true)
      })
    }

    track.asin = asin

    return retryOnUniqueViolation(async () => {
      // @ts-ignore
      return await track.save()
    })
  }
}
