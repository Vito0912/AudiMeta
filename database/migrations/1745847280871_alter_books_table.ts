import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'books'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('content_type')
      table.string('content_delivery_type')

      table.string('episode_number')
      table.string('episode_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('content_type', 'content_delivery_type', 'episode_number', 'episode_type')
    })
  }
}
