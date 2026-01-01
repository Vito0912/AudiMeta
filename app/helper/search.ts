import { Infer } from '@vinejs/vine/types'
import { basicSearchValidator, quickSearchValidator } from '#validators/search'
import axios from 'axios'
import { audibleHeaders, getAudibleExtraHeaders, regionMap } from '#config/app'
import { BookHelper } from './book.js'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { AudibleHelper } from './audible.js'

export class SearchHelper {
  static async search(payload: Infer<typeof basicSearchValidator>) {
    const ctx = HttpContext.get()
    const { limit, region, cache, ...restPayload } = payload
    const searchParams = {
      ...restPayload,
      num_results: limit,
    }

    const startTime = DateTime.now()

    const response = await axios.get(
      `https://api.audible${regionMap[region]}/1.0/catalog/products/`,
      {
        headers: audibleHeaders,
        params: searchParams,
      }
    )

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Search`,
        search_params: searchParams,
        search_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (response.status === 200) {
      const asins: string[] = response.data.products.map((product: any) => product.asin)

      if (asins.length === 0) {
        return []
      }
      return await new BookHelper().getOrFetchBooks(asins, payload.region, payload.cache)
    }
  }

  static async quickSearch(payload: Infer<typeof quickSearchValidator>) {
    const ctx = HttpContext.get()

    const startTime = DateTime.now()

    const response = await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/searchsuggestions`,
      {
        headers: { ...getAudibleExtraHeaders(payload.region), ...audibleHeaders },
        params: {
          keywords: payload.keywords,
          key_strokes: payload.keywords,
          site_variant: 'desktop',
          session_id: AudibleHelper.generateRandomSessionId(),
          local_time: new Date().toISOString(),
          surface: 'Android',
        },
      }
    )

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Quick Search`,
        search_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    const asins: string[] = []

    if (response.status === 200) {
      const json = response.data

      if (json && json.model && json.model.items) {
        const items = json.model.items
        for (const item of items) {
          if (item.view?.template && item.view?.template === 'AsinRow') {
            if (item.model?.product_metadata?.asin) {
              asins.push(item.model.product_metadata.asin)
            }
          }
        }
      }

      if (asins.length === 0) {
        return []
      }

      return await new BookHelper().getOrFetchBooks(asins, payload.region, true)
    }

    return []
  }
}
