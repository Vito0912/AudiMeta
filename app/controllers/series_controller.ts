// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { authorBookValidator, getBasicValidator, searchSeriesValidator } from '#validators/common'
import NotFoundException from '#exceptions/not_found_exception'
import SeriesDto from '#dtos/series'
import { SeriesHelper } from '../helper/series.js'
import BookDto from '#dtos/book'
import { ApiOperation, ApiTags } from '@foadonis/openapi/decorators'
import {
  asinApiQuery,
  cacheApiQuery,
  nameApiQuery,
  notFoundApiResponse,
  regionApiQuery,
  successApiResponse,
} from '#config/openapi'

@ApiTags('Series')
export default class SeriesController {
  @ApiOperation({
    summary: 'Get a series by ASIN',
    operationId: 'getSeries',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: SeriesDto })
  async index({ request }: HttpContext) {
    const payload = await getBasicValidator.validate({ ...request.qs(), ...request.params() })

    const series = await SeriesHelper.get(payload)

    if (!series) throw new NotFoundException()

    return new SeriesDto(series)
  }

  @ApiOperation({
    summary: 'Get books by series',
    description: 'This gets a list of books by the series.',
    operationId: 'getBooksBySeries',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async books({ request }: HttpContext) {
    const payload = await authorBookValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await SeriesHelper.getBooksBySeries(payload)) ?? [])
  }

  @ApiOperation({
    summary: 'Get episodes from podcast (series)',
    description:
      'This gets a list of episodes from a podcast series. Note that this is the same as a series ASIN, but sorted for podcasts.',
    operationId: 'getPodcastEpisodes',
  })
  @asinApiQuery()
  @regionApiQuery()
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [BookDto] })
  async podcast({ request }: HttpContext) {
    const payload = await authorBookValidator.validate({ ...request.qs(), ...request.params() })

    return BookDto.fromArray((await SeriesHelper.getBooksBySeries(payload, true)) ?? [])
  }

  @ApiOperation({
    summary: 'Search for series',
    description:
      'This searches for series by name (Only using the DB. At least one book of the series must be in the DB).',
    operationId: 'searchSeries',
  })
  @nameApiQuery(true)
  @cacheApiQuery()
  @notFoundApiResponse()
  @successApiResponse({ type: [SeriesDto] })
  async search({ request }: HttpContext) {
    const payload = await searchSeriesValidator.validate({ ...request.qs() })

    const series = await SeriesHelper.search(payload)

    if (!series || series.length === 0) throw new NotFoundException()

    return SeriesDto.fromArray(series)
  }
}
