import { BaseModelDto } from '@adocasts.com/dto/base'
import Series from '#models/series'

export class MinimalSeriesDto extends BaseModelDto {
  declare asin: string
  declare title: string
  declare position: string
  declare updatedAt: string

  constructor(series?: Series) {
    super()

    if (!series) return
    this.asin = series.asin
    this.title = series.title
    if (series.$extras.pivot_position) {
      this.position = series.$extras.pivot_position
    }
    this.updatedAt = series.updatedAt && series.updatedAt.toISO()!
  }
}

export default class SeriesDto extends MinimalSeriesDto {
  declare description: string

  constructor(series?: Series) {
    super(series)

    if (!series) return
    this.description = series.description
  }
}
