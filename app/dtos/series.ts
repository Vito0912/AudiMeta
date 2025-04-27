import { BaseModelDto } from '@adocasts.com/dto/base'
import Series from '#models/series'

export class MinimalSeriesDto extends BaseModelDto {
  declare asin: string
  declare name: string
  declare position: string | null
  declare updatedAt: string | null

  constructor(series?: Series) {
    super()

    if (!series) return
    this.asin = series.asin
    this.name = series.title ?? null
    if (series.$extras.pivot_position) {
      this.position = series.$extras.pivot_position
    } else {
      this.position = null
    }
    this.updatedAt = (series.updatedAt && series.updatedAt.toISO()!) ?? null
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
