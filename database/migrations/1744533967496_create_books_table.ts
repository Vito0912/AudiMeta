import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'books'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('asin', 12).primary().unique()

      table.text('title').notNullable()
      table.text('subtitle')
      table
        .enum('region', ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'])
        .notNullable()
      table.text('description')
      table.text('summary')
      table.text('publisher')
      table.text('copyright')
      table.string('isbn', 16)
      table.string('language')
      table.double('rating')
      table.datetime('release_date')
      table.integer('length_minutes')

      table.boolean('explicit').defaultTo(false)
      table.boolean('whisper_sync').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('asin', 'books_asin_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
