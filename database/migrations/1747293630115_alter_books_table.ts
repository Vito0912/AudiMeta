import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'books'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_listenable').defaultTo(true).after('is_published')
      table.boolean('is_buyable').defaultTo(true).after('is_listenable')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_listenable')
      table.dropColumn('is_buyable')
    })
  }
}
