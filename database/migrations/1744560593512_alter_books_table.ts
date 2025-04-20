import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'books'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('book_format').nullable()
      table.boolean('has_pdf').defaultTo(false)
      table.string('image').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('book_format')
      table.dropColumn('has_pdf')
      table.dropColumn('image')
    })
  }
}
