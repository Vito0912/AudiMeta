import { BaseModelDto } from '@adocasts.com/dto/base'
import Book from '#models/book'
import { MinimalAuthorDto } from '#dtos/author'
import NarratorDto from '#dtos/narrator'
import GenreDto from '#dtos/genre'
import { MinimalSeriesDto } from '#dtos/series'
import { regionMap } from '#config/app'

export default class BookDto extends BaseModelDto {
  declare asin: string
  declare title: string
  declare subtitle: string | null
  declare description: string | null
  declare image: string | null
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'
  declare regions: (typeof this.region)[]
  declare summary: string | null
  declare publisher: string | null
  declare copyright: string | null
  declare isbn: string | null
  declare language: string | null
  declare rating: number | null
  declare bookFormat: string | null
  declare releaseDate: string | null
  declare explicit: boolean
  declare hasPdf: boolean
  declare authors: MinimalAuthorDto[]
  declare narrators: NarratorDto[]
  declare genres: GenreDto[]
  declare series: MinimalSeriesDto[]
  declare imageUrl: string | null
  declare lengthMinutes: number | null
  declare updatedAt: string | null
  declare whisperSync: boolean
  declare link: string | null
  declare contentType: string | null
  declare contentDeliveryType: string | null
  declare episodeNumber: string | null
  declare episodeType: string | null

  constructor(book?: Book) {
    super()

    if (!book) return

    this.asin = book.asin
    this.title = book.title
    this.subtitle = book.subtitle
    this.region = book.region
    this.regions = book.regions

    this.description = book.description
    this.summary = book.summary

    this.copyright = book.copyright
    this.bookFormat = book.bookFormat

    this.imageUrl = book.image
    this.lengthMinutes = book.lengthMinutes
    this.whisperSync = book.whisperSync

    this.publisher = book.publisher
    this.isbn = book.isbn
    this.language = book.language
    this.rating = book.rating
    this.releaseDate = book.releaseDate?.toISO()!
    this.explicit = book.explicit
    this.hasPdf = book.hasPdf
    this.link = `https://audible${regionMap[book.region ?? 'us']}/pd/${book.asin}`

    this.contentType = book.contentType
    this.contentDeliveryType = book.contentDeliveryType

    if (this.contentType && this.contentType.toLowerCase() === 'podcast') {
      this.episodeNumber = book.episodeNumber
      this.episodeType = book.episodeType
    }

    this.authors = MinimalAuthorDto.fromArray(book.authors)
    this.narrators = NarratorDto.fromArray(book.narrators)
    this.genres = GenreDto.fromArray(book.genres)
    this.series = MinimalSeriesDto.fromArray(book.series)
    this.updatedAt = book.updatedAt && book.updatedAt.toISO()!
  }
}

export class AbsBookDto extends BaseModelDto {
  declare asin: string
  declare title: string
  declare subtitle: string | null
  declare description: string | null
  declare cover: string | null

  declare publisher: string | null
  declare publishedYear: string | null
  declare isbn: string | null
  declare language: string | null
  declare duration: string | null

  declare author: string | null
  declare narrator: string | null

  declare tags: string[] | null
  declare genres: string[] | null

  declare series: { series: string; sequence: string }[] | null

  constructor(book?: Book) {
    super()

    if (!book) return

    this.asin = book.asin
    this.title = book.title ?? null
    this.subtitle = book.subtitle ?? null

    this.description = book.description ?? null

    this.publisher = book.publisher ?? null
    this.publishedYear = book.releaseDate?.toFormat('yyyy') ?? null
    this.duration = book.lengthMinutes?.toString() ?? null
    this.author = book.authors?.map((author) => author.name).join(', ') || null
    this.narrator = book.narrators?.map((narrator) => narrator.name).join(', ') || null
    this.tags =
      book.genres?.filter((genre) => genre.type === 'Tags').map((genre) => genre.name) || null
    this.genres =
      book.genres?.filter((genre) => genre.type === 'Genres').map((genre) => genre.name) || null
    this.isbn = book.isbn ?? null
    this.language = book.language ?? null
    this.cover = book.image ?? null

    this.series =
      (book.series &&
        book.series.map((series) => {
          return {
            series: series.title,
            sequence: series.$extras.pivot_position,
          }
        })) ??
      null
  }
}
