import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'book_series'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('book_asin', 12).notNullable().references('asin').inTable('books')
      table.string('series_asin', 12).notNullable().references('asin').inTable('series')
      table.string('position').nullable()

      table.primary(['book_asin', 'series_asin'])
      table.index(['book_asin', 'series_asin'], 'book_series_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
