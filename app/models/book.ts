import { DateTime } from 'luxon'
import { BaseModel, column, computed, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import Author from '#models/author'
import type { HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import Narrator from '#models/narrator'
import Genre from '#models/genre'
import Series from '#models/series'
import Track from '#models/track'

export default class Book extends BaseModel {
  @column({ isPrimary: true })
  declare asin: string

  @column()
  declare title: string

  @column()
  declare subtitle: string | null

  @column()
  declare description: string | null

  @column()
  declare image: string | null

  @column()
  declare region: 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'

  @computed()
  get regions() {
    return [this.region]
  }

  @column()
  declare summary: string | null

  @column()
  declare publisher: string | null

  @column()
  declare copyright: string | null

  @column()
  declare isbn: string | null

  @column()
  declare language: string | null

  @column()
  declare rating: number | null

  @column()
  declare bookFormat: string | null

  @column.dateTime()
  declare releaseDate: DateTime | null

  @column()
  declare explicit: boolean

  @column()
  declare hasPdf: boolean

  @column()
  declare lengthMinutes: number | null

  @column()
  declare whisperSync: boolean

  @column()
  declare contentType: string | null

  @column()
  declare contentDeliveryType: string | null

  @column()
  declare episodeNumber: string | null

  @column()
  declare episodeType: string | null

  @column()
  declare sku: string | null

  @column()
  declare skuGroup: string | null

  @hasOne(() => Track)
  declare track: HasOne<typeof Track>

  @manyToMany(() => Author, {
    pivotTable: 'author_book',
    localKey: 'asin', // Book model primary key
    relatedKey: 'id', // Author model primary key
    pivotForeignKey: 'book_asin', // Column on the pivot table referencing Book
    pivotRelatedForeignKey: 'author_id', // Column on the pivot table referencing Author
  })
  declare authors: ManyToMany<typeof Author>

  @manyToMany(() => Narrator, {
    pivotTable: 'book_narrator',
    localKey: 'asin',
    relatedKey: 'name',
  })
  declare narrators: ManyToMany<typeof Narrator>

  @manyToMany(() => Genre)
  declare genres: ManyToMany<typeof Genre>

  @manyToMany(() => Series, {
    pivotColumns: ['position'],
  })
  declare series: ManyToMany<typeof Series>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
