import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'authors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('asin', 12).nullable()
      table.text('name').notNullable()
      table
        .enum('region', ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'])
        .notNullable()
      table.text('description')
      table.text('image')

      table.unique(['asin', 'region', 'name'])
      table.unique('id')

      table.index(['asin', 'region', 'name'])
      table.index(['region', 'name'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
