import { BaseModelDto } from '@adocasts.com/dto/base'
import Book from '#models/book'
import { MinimalAuthorDto } from '#dtos/author'
import NarratorDto from '#dtos/narrator'
import GenreDto from '#dtos/genre'
import { MinimalSeriesDto } from '#dtos/series'
import { regionMap } from '#config/app'
import { asinApiProperty, imageApiProperty, updatedAtApiProperty } from '#config/openapi'
import { ApiProperty } from '@foadonis/openapi/decorators'

export default class BookDto extends BaseModelDto {
  @asinApiProperty()
  declare asin: string

  @ApiProperty({
    description: 'The title of the book.',
    type: 'string',
    example: 'The Great Gatsby',
  })
  declare title: string

  @ApiProperty({
    description: 'The subtitle of the book, if available.',
    type: 'string',
    example: 'A Novel',
    nullable: true,
  })
  declare subtitle: string | null

  @ApiProperty({
    description: 'A brief description of the book.',
    type: 'string',
    example: 'A classic novel set in the 1920s.',
    nullable: true,
  })
  declare description: string | null

  @ApiProperty({
    description: 'The region of the book, e.g., "us", "ca", "uk".',
    type: 'string',
    enum: ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'],
    example: 'us',
  })
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'

  @ApiProperty({
    description: 'The regions where the book is available.',
    type: [String],
    example: ['us', 'ca', 'uk'],
    deprecated: true,
  })
  declare regions: (typeof this.region)[]

  @ApiProperty({
    description: 'A brief summary of the book, if available.',
    type: 'string',
    example: 'This is a summary of the book.',
    nullable: true,
  })
  declare summary: string | null

  @ApiProperty({
    description: 'The publisher of the book, if available.',
    type: 'string',
    example: 'Penguin Random House',
    nullable: true,
  })
  declare publisher: string | null

  @ApiProperty({
    description: 'The copyright information of the book, if available.',
    type: 'string',
    example: '© 2023 Penguin Random House',
    nullable: true,
  })
  declare copyright: string | null

  @ApiProperty({
    description: 'The ISBN of the book, if available.',
    type: 'string',
    example: '978-3-16-148410-0',
    nullable: true,
  })
  declare isbn: string | null

  @ApiProperty({
    description: 'The language of the book, if available.',
    type: 'string',
    example: 'english',
  })
  declare language: string | null

  @ApiProperty({
    description: 'The rating of the book, if available.',
    type: 'number',
    example: 4.5,
  })
  declare rating: number | null

  @ApiProperty({
    description: 'The format of the book',
    type: 'string',
    nullable: true,
  })
  declare bookFormat: string | null

  @ApiProperty({
    description: 'The release date of the book, if available.',
    type: 'string',
    format: 'datetime',
    example: '2023-10-01',
  })
  declare releaseDate: string | null

  @ApiProperty({
    description: 'Whether the book contains explicit content.',
    type: 'boolean',
    example: false,
  })
  declare explicit: boolean

  @ApiProperty({
    description: 'Whether the book has a PDF version available.',
    type: 'boolean',
    example: false,
  })
  declare hasPdf: boolean

  @ApiProperty({
    description: 'The authors of the book.',
    type: [MinimalAuthorDto],
  })
  declare authors: MinimalAuthorDto[]

  @ApiProperty({
    description: 'The narrators of the book.',
    type: [NarratorDto],
  })
  declare narrators: NarratorDto[]

  @ApiProperty({
    description: 'The genres of the book.',
    type: [GenreDto],
  })
  declare genres: GenreDto[]

  @ApiProperty({
    description: 'The series the book belongs to.',
    type: [MinimalSeriesDto],
  })
  declare series: MinimalSeriesDto[]

  @imageApiProperty()
  declare imageUrl: string | null

  @ApiProperty({
    description: 'The length of the book in minutes, if available.',
    type: 'number',
    example: 360,
    nullable: true,
  })
  declare lengthMinutes: number | null

  @updatedAtApiProperty()
  declare updatedAt: string | null

  @ApiProperty({
    description: 'Whether the book supports WhisperSync.',
    type: 'boolean',
    example: true,
  })
  declare whisperSync: boolean

  @ApiProperty({
    description: 'The link to the book on Audible.',
    type: 'string',
    format: 'uri',
    example: 'https://audible.com/pd/B019NODM94',
    nullable: true,
  })
  declare link: string | null

  @ApiProperty({
    description: 'The content type of the book',
    type: 'string',
    nullable: true,
  })
  declare contentType: string | null

  @ApiProperty({
    description: 'The content delivery type of the book',
    type: 'string',
    nullable: true,
  })
  declare contentDeliveryType: string | null

  @ApiProperty({
    description: 'The episode number of the book, if it is a podcast.',
    type: 'string',
    nullable: true,
  })
  declare episodeNumber: string | null

  @ApiProperty({
    description: 'The episode type of the book, if it is a podcast.',
    type: 'string',
    nullable: true,
  })
  declare episodeType: string | null

  @ApiProperty({
    description: 'The SKU of the book, if available.',
    type: 'string',
    nullable: true,
  })
  declare sku: string | null

  @ApiProperty({
    description: 'The SKU group of the book, if available.',
    type: 'string',
    nullable: true,
  })
  declare skuGroup: string | null

  @ApiProperty({
    description: 'Whether the book is listenable.',
    type: 'boolean',
    example: true,
  })
  declare isListenable: boolean

  @ApiProperty({
    description: 'Whether the book is available for purchase.',
    type: 'boolean',
    example: true,
  })
  declare isAvailable: boolean

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

    this.sku = book.sku ?? null
    this.skuGroup = book.skuGroup ?? null

    this.isListenable = book.isListenable
    this.isAvailable = book.isBuyable

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

    this.description = book.summary ?? book.description ?? null

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
