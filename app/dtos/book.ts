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
  declare updatedAt: string
  declare whisperSync: boolean
  declare link: string

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

    this.authors = MinimalAuthorDto.fromArray(book.authors)
    this.narrators = NarratorDto.fromArray(book.narrators)
    this.genres = GenreDto.fromArray(book.genres)
    this.series = MinimalSeriesDto.fromArray(book.series)
    this.updatedAt = book.updatedAt && book.updatedAt.toISO()!
  }
}
