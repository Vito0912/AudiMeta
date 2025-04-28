import { Infer } from '@vinejs/vine/types'
import { authorBookValidator, getBasicValidator, searchSeriesValidator } from '#validators/common'
import axios from 'axios'
import { audibleHeaders, regionMap } from '#config/app'
import { HttpContext } from '@adonisjs/core/http'
import NotFoundException from '#exceptions/not_found_exception'
import { BookHelper } from './book.js'
import Book from '#models/book'
import { DateTime } from 'luxon'
import retryOnUniqueViolation from './parallel_helper.js'
import Series from '#models/series'

export class SeriesHelper {
  static async get(payload: Infer<typeof getBasicValidator>) {
    let series = await Series.query().where('asin', payload.asin).first()

    if (!payload.cache || !series || (!series.description && !series.fetchedDescription)) {
      const newSeries = await SeriesHelper.fetchFromAudible(payload, series)
      if (newSeries) {
        series = newSeries
      }
    }

    if (!series) {
      throw new NotFoundException()
    }

    return series
  }

  private static async getSeriesPage(payload: Infer<typeof getBasicValidator>) {
    return await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/catalog/products/` + payload.asin,
      {
        headers: { ...audibleHeaders },
        params: {
          response_groups: 'product_attrs, product_desc, product_extended_attrs',
        },
      }
    )
  }

  private static async fetchFromAudible(
    payload: Infer<typeof getBasicValidator>,
    series?: Series | null
  ): Promise<Series | null> {
    const startTime = new Date()
    const ctx = HttpContext.get()

    const response = await SeriesHelper.getSeriesPage(payload)

    if (
      !response?.data ||
      !response.data.response_groups ||
      response.data.response_groups.length === 1
    ) {
      throw new NotFoundException()
    }

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Series`,
        series_took: Math.abs(startTime.getTime() - new Date().getTime()),
      })

    if (response.status === 200) {
      const json: any = response.data
      if (!json || !json.product) {
        throw new NotFoundException()
      }

      if (!series) series = new Series()

      if (json.product!.publisher_summary) {
        series.description = json.product!.publisher_summary
      }
      series.fetchedDescription = true
      series.asin = json.product!.asin
      series.title = json.product!.title

      return retryOnUniqueViolation(async () => {
        return await series!.save()
      })
    }

    return null
  }

  static async getBooksBySeries(
    payload: Infer<typeof authorBookValidator>,
    sortByEpisode: boolean = false
  ): Promise<Book[] | null> {
    let series = await Series.query().where('asin', payload.asin).first()

    if (!series) {
      series = await SeriesHelper.fetchFromAudible({ ...payload })
    }

    if (!series) {
      throw new NotFoundException()
    }

    const asins: string[] = []

    const startTime = DateTime.now()
    const ctx = HttpContext.get()

    const response = await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/catalog/products/` + payload.asin,
      {
        headers: { ...audibleHeaders },
        params: {
          response_groups: 'relationships',
        },
      }
    )

    if (response && response.status === 200) {
      const json: any = response.data
      if (json && json.product && json.product.relationships) {
        const items = json.product.relationships
          .filter((item: { asin: any; sort: any }) => item.asin && item.sort)
          .sort(
            (a: { sort: string }, b: { sort: string }) =>
              Number.parseFloat(a.sort) - Number.parseFloat(b.sort)
          )
        for (const item of items) {
          asins.push(item.asin)
        }
      }
    }

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Series Books`,
        series_book_num: asins.length,
        series_book_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (asins.length === 0) {
      throw new NotFoundException()
    }

    return await new BookHelper().getOrFetchBooks(asins, payload.region, true, sortByEpisode)
  }

  static async search(payload: Infer<typeof searchSeriesValidator>) {
    const series = await Series.query().whereILike('title', payload.name).limit(10)

    if (series.length === 0) {
      throw new NotFoundException()
    }

    return series
  }
}
