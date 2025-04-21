import { Infer } from '@vinejs/vine/types'
import { basicSearchValidator } from '#validators/search'
import axios from 'axios'
import { audibleHeaders, regionMap } from '#config/app'
import { BookHelper } from './book.js'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

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
}
