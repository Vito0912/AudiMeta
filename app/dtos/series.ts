import { BaseModelDto } from '@adocasts.com/dto/base'
import Series from '#models/series'
import {
  asinApiProperty,
  descriptionApiProperty,
  nameApiProperty,
  updatedAtApiProperty,
} from '#config/openapi'
import { ApiProperty } from '@foadonis/openapi/decorators'

export class MinimalSeriesDto extends BaseModelDto {
  @asinApiProperty()
  declare asin: string

  @nameApiProperty()
  declare name: string

  @ApiProperty({
    description: 'The region of the book, e.g., "us", "ca", "uk".',
    type: 'string',
    enum: ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'],
    example: 'us',
    nullable: true,
  })
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br' | null

  @ApiProperty({
    description: 'The position of the series in the list. Can be a string!',
    type: 'string',
    example: '1',
    nullable: true,
  })
  declare position: string | null

  @updatedAtApiProperty()
  declare updatedAt: string | null

  constructor(series?: Series) {
    super()

    if (!series) return
    this.asin = series.asin
    this.name = series.title ?? null
    this.region = series.region ?? null
    if (series.$extras.pivot_position) {
      this.position = series.$extras.pivot_position
    } else {
      this.position = null
    }
    this.updatedAt = (series.updatedAt && series.updatedAt.toISO()!) ?? null
  }
}

export default class SeriesDto extends MinimalSeriesDto {
  @descriptionApiProperty()
  declare description: string

  constructor(series?: Series) {
    super(series)

    if (!series) return
    this.description = series.description
  }
}
