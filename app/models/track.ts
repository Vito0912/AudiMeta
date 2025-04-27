import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Book from '#models/book'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Track extends BaseModel {
  @column({ isPrimary: true })
  declare asin: string

  @column()
  declare chapters: object

  @belongsTo(() => Book)
  declare book: BelongsTo<typeof Book>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
