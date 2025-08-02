import { BaseModelDto } from '@adocasts.com/dto/base'
import Author from '#models/author'
import GenreDto from '#dtos/genre'
import {
  asinApiProperty,
  descriptionApiProperty,
  imageApiProperty,
  updatedAtApiProperty,
} from '#config/openapi'
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@foadonis/openapi/decorators'

@ApiTags('Authors')
export class MinimalAuthorDto extends BaseModelDto {
  declare id: number

  @asinApiProperty()
  declare asin: string

  @ApiProperty({
    description: 'The name of the author.',
    type: 'string',
    example: 'John Doe',
    nullable: true,
  })
  declare name: string

  @ApiProperty({
    description: 'The region of the author.',
    type: 'string',
    enum: ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'],
    example: 'us',
  })
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'

  @ApiProperty({
    description: 'The regions of the author.',
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'],
    },
    deprecated: true,
  })
  declare regions: (typeof this.region)[]

  @imageApiProperty()
  declare image: string

  @updatedAtApiProperty()
  declare updatedAt: string

  constructor(author?: Author) {
    super()

    if (!author) return
    this.asin = author.asin ?? null
    this.name = author.name ?? null
    this.region = author.region ?? null
    this.regions = author.regions ?? null
    this.image = author.image ?? null
    this.updatedAt = (author.updatedAt && author.updatedAt.toISO()!) ?? null
  }
}

export class AuthorDto extends MinimalAuthorDto {
  @descriptionApiProperty()
  declare description: string

  @ApiPropertyOptional({
    type: [GenreDto],
    description: 'List of genres associated with the author.',
    deprecated: true,
  })
  declare genres: GenreDto[]

  constructor(author?: Author) {
    super(author)

    if (!author) return
    this.description = author.description
    this.genres = []
  }
}
