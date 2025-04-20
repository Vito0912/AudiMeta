import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'book_narrator'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text('narrator_name').notNullable().references('name').inTable('narrators')
      table.string('book_asin', 12).notNullable().references('asin').inTable('books')

      table.primary(['narrator_name', 'book_asin'])
      table.index(['book_asin', 'narrator_name'], 'book_narrator_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
