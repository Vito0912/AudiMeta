import { BaseModelDto } from '@adocasts.com/dto/base'
import Track from '#models/track'
import { asinApiProperty, updatedAtApiProperty } from '#config/openapi'
import { ApiProperty } from '@foadonis/openapi/decorators'

class SingleChapterDto {
  @ApiProperty({
    description: 'The length of the chapter in milliseconds.',
    type: 'number',
    example: 60000,
  })
  declare lengthMs: number

  @ApiProperty({
    description: 'The start offset of the chapter in milliseconds.',
    type: 'number',
    example: 0,
  })
  declare startOffsetMs: number

  @ApiProperty({
    description: 'The start offset of the chapter in seconds.',
    type: 'number',
    example: 0,
  })
  declare startOffsetSec: number

  @ApiProperty({
    description: 'The title of the chapter.',
    type: 'string',
    example: 'Introduction',
  })
  declare title: string

  constructor(chapter?: object) {
    if (!chapter) return
    // @ts-ignore
    this.lengthMs = chapter.lengthMs ?? 0
    // @ts-ignore
    this.startOffsetMs = chapter.startOffsetMs ?? 0
    // @ts-ignore
    this.startOffsetSec = chapter.startOffsetSec ?? 0
    // @ts-ignore
    this.title = chapter.title ?? ''
  }
}

export default class TrackDto extends BaseModelDto {
  @asinApiProperty()
  declare asin: string

  @ApiProperty({
    description: 'The chapters of the track, if available.',
    type: [SingleChapterDto],
    nullable: true,
  })
  declare chapters: object | null

  @updatedAtApiProperty()
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
  @ApiProperty({
    description: 'The duration in seconds of the brand intro "e.g. Welcome to Audible".',
    type: 'number',
    example: 3000,
  })
  declare brandIntroDurationMs: number

  @ApiProperty({
    description: 'The duration in seconds of the brand outro.',
    type: 'number',
    example: 3000,
  })
  declare brandOutroDurationMs: number

  @ApiProperty({
    description: 'The chapters of the track, if available.',
    type: [SingleChapterDto],
    nullable: true,
  })
  declare chapters: SingleChapterDto[]

  @ApiProperty({
    description: '??? TBA',
    type: 'boolean',
    example: true,
  })
  declare isAccurate: boolean

  @ApiProperty({
    description: 'The total runtime length of the track in milliseconds.',
    type: 'number',
    example: 3600000,
  })
  declare runtimeLengthMs: number

  @ApiProperty({
    description: 'The total runtime length of the track in seconds.',
    type: 'number',
    example: 3600,
  })
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
        track.chapters.map((chapter: any) => new SingleChapterDto(chapter))
      : []
  }
}
