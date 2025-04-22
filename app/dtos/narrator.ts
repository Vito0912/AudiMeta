import { BaseModelDto } from '@adocasts.com/dto/base'
import Narrator from '#models/narrator'

export default class NarratorDto extends BaseModelDto {
  declare name: string
  declare updatedAt: string

  constructor(narrator?: Narrator) {
    super()

    if (!narrator) return
    this.name = narrator.name
    this.updatedAt = narrator.updatedAt && narrator.updatedAt.toISO()!
  }
}
