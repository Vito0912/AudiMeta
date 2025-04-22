import { BaseModelDto } from '@adocasts.com/dto/base'
import Genre from '#models/genre'
import BookDto from '#dtos/book'

export default class GenreDto extends BaseModelDto {
  declare asin: string
  declare name: string
  declare type: 'Genres' | 'Tags'
  declare betterType: 'genre' | 'tag'
  declare books: BookDto[]
  declare updatedAt: string

  constructor(genre?: Genre) {
    super()

    if (!genre) return
    this.asin = genre.asin
    this.name = genre.name
    this.type = genre.type
    // @ts-ignore
    this.betterType = genre.betterType

    this.updatedAt = genre.updatedAt && genre.updatedAt.toISO()!
  }
}
