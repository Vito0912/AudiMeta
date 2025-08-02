import { BaseModelDto } from '@adocasts.com/dto/base'
import Narrator from '#models/narrator'
import { nameApiProperty, updatedAtApiProperty } from '#config/openapi'

export default class NarratorDto extends BaseModelDto {
  @nameApiProperty()
  declare name: string

  @updatedAtApiProperty()
  declare updatedAt: string | null

  constructor(narrator?: Narrator) {
    super()

    if (!narrator) return
    this.name = narrator.name ?? null
    this.updatedAt = (narrator.updatedAt && narrator.updatedAt.toISO()!) ?? null
  }
}
