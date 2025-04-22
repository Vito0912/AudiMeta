import { BaseModelDto } from '@adocasts.com/dto/base'
import Track from '#models/track'

export default class TrackDto extends BaseModelDto {
  declare asin: string
  declare chapters: string
  declare updatedAt: string

  constructor(track?: Track) {
    super()

    if (!track) return
    this.asin = track.asin
    this.chapters = track.chapters
    this.updatedAt = track.updatedAt && track.updatedAt.toISO()!
  }
}
