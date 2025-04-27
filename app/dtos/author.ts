import { BaseModelDto } from '@adocasts.com/dto/base'
import Author from '#models/author'
import BookDto from '#dtos/book'
import GenreDto from '#dtos/genre'

export class MinimalAuthorDto extends BaseModelDto {
  declare id: number
  declare asin: string
  declare name: string
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'
  declare regions: (typeof this.region)[]
  declare image: string
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
  declare description: string
  declare books: BookDto[]
  declare genres: GenreDto[]

  constructor(author?: Author) {
    super(author)

    if (!author) return
    this.description = author.description
    this.genres = []
  }
}
