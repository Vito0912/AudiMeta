import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'book_genre'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('book_asin', 12).notNullable().references('asin').inTable('books')
      table.string('genre_asin', 12).notNullable().references('asin').inTable('genres')

      table.index(['book_asin', 'genre_asin'], 'book_genre_index')
      table.index(['genre_asin', 'book_asin'], 'genre_book_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
