import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'author_genre'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('author_id').unsigned().notNullable().references('id').inTable('authors')
      table.string('genre_asin', 12).notNullable().references('asin').inTable('genres')

      table.index(['genre_asin', 'author_id'], 'author_genre_index')
      table.index(['author_id', 'genre_asin'], 'genre_author_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
