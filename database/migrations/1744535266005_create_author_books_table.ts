import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'author_book'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // author id

      table.integer('author_id').unsigned().notNullable().references('id').inTable('authors')

      table.string('book_asin', 12).notNullable().references('asin').inTable('books')

      table.primary(['author_id', 'book_asin'])
      table.index(['book_asin', 'author_id'], 'book_author_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
