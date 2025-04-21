import { DateTime } from 'luxon'
import { BaseModel, column, computed, manyToMany } from '@adonisjs/lucid/orm'
import Book from '#models/book'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Genre from '#models/genre'

export default class Author extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare asin: string

  @column()
  // @enum(us, ca, uk, au, fr, de, jp, it, in, es, br)
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'

  @column()
  declare name: string

  @column()
  declare noDescription: boolean

  @computed()
  get regions() {
    return [this.region]
  }

  @column()
  declare description: string

  @column()
  declare image: string

  @manyToMany(() => Book)
  declare books: ManyToMany<typeof Book>

  @manyToMany(() => Genre)
  declare genres: ManyToMany<typeof Genre>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
