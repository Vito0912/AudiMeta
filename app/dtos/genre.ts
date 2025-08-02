import { BaseModelDto } from '@adocasts.com/dto/base'
import Genre from '#models/genre'
import { genreAsinApiProperty, nameApiProperty, updatedAtApiProperty } from '#config/openapi'
import { ApiProperty } from '@foadonis/openapi/decorators'

export default class GenreDto extends BaseModelDto {
  @genreAsinApiProperty()
  declare asin: string

  @nameApiProperty()
  declare name: string

  @ApiProperty({
    description: 'The type of the genre or tag.',
    type: 'string',
    enum: ['Genres', 'Tags'],
    example: 'Genres',
  })
  declare type: 'Genres' | 'Tags'

  @ApiProperty({
    description: 'The better type of the genre or tag.',
    type: 'string',
    enum: ['genre', 'tag'],
    example: 'genre',
  })
  declare betterType: 'genre' | 'tag'

  @updatedAtApiProperty()
  declare updatedAt: string | null

  constructor(genre?: Genre) {
    super()

    if (!genre) return
    this.asin = genre.asin
    this.name = genre.name ?? null
    this.type = genre.type ?? null
    // @ts-ignore
    this.betterType = genre.betterType ?? null

    this.updatedAt = (genre.updatedAt && genre.updatedAt.toISO()!) ?? null
  }
}
