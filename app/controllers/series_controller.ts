// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { getBasicValidator, paginationValidator, searchSeriesValidator } from '#validators/common'
import NotFoundException from '#exceptions/not_found_exception'
import SeriesDto from '#dtos/series'
import { SeriesHelper } from '../helper/series.js'
import BookDto from '#dtos/book'

export default class SeriesController {
  async index({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    const series = await SeriesHelper.get(payload)

    if (!series) throw new NotFoundException()

    return new SeriesDto(series)
  }

  async books({ request }: HttpContext) {
    const payload = await paginationValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await SeriesHelper.getBooksBySeries(payload)) ?? [])
  }

  async podcast({ request }: HttpContext) {
    const payload = await paginationValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await SeriesHelper.getBooksBySeries(payload, true)) ?? [])
  }

  async search({ request }: HttpContext) {
    const payload = await searchSeriesValidator.validate({ ...request.qs() })

    const series = await SeriesHelper.search(payload)

    if (!series || series.length === 0) throw new NotFoundException()

    return SeriesDto.fromArray(series)
  }
}
