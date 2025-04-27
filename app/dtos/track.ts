import { BaseModelDto } from '@adocasts.com/dto/base'
import Track from '#models/track'

export default class TrackDto extends BaseModelDto {
  declare asin: string
  declare chapters: object | null
  declare updatedAt: string | null

  constructor(track?: Track) {
    super()

    if (!track) return
    this.asin = track.asin
    this.chapters = track.chapters ?? null
    this.updatedAt = (track.updatedAt && track.updatedAt.toISO()!) ?? null
  }
}

export class TrackContentDto extends BaseModelDto {
  declare brandIntroDurationMs: number
  declare brandOutroDurationMs: number
  declare chapters: {
    lengthMs: number
    startOffsetMs: number
    startOffsetSec: number
    title: string
  }[]
  declare isAccurate: boolean
  declare runtimeLengthMs: number
  declare runtimeLengthSec: number

  constructor(track?: object) {
    super()

    if (!track) return
    // @ts-ignore
    this.brandIntroDurationMs = track.brandIntroDurationMs ?? 0
    // @ts-ignore
    this.brandOutroDurationMs = track.brandOutroDurationMs ?? 0
    // @ts-ignore
    this.isAccurate = track.is_accurate ?? false
    // @ts-ignore
    this.runtimeLengthMs = track.runtime_length_ms ?? 0
    // @ts-ignore
    this.runtimeLengthSec = track.runtime_length_sec ?? 0
    // @ts-ignore
    this.chapters = Array.isArray(track.chapters)
      ? // @ts-ignore
        track.chapters.map((chapter: any) => ({
          lengthMs: chapter.length_ms ?? 0,
          startOffsetMs: chapter.start_offset_ms ?? 0,
          startOffsetSec: chapter.start_offset_sec ?? 0,
          title: chapter.title ?? '',
        }))
      : []
  }
}
