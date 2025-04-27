import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import cache from '@adonisjs/cache/services/main'

export default class CacheMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const queryParams = ctx.request.qs()

    const { cache1, ...filteredQueries } = queryParams
    const sortedKeys = Object.keys(filteredQueries).sort()

    const params = sortedKeys.reduce((searchParams, key) => {
      searchParams.append(key.toLowerCase(), `${filteredQueries[key]}`.toLowerCase())
      return searchParams
    }, new URLSearchParams())

    const cacheKey = `${ctx.request.url(false)}?${params.toString()}`

    if (queryParams.cache && `${queryParams.cache}`.toLowerCase() === 'false') {
      const cachedRequest = await next()

      await this.cacheResponse(ctx, cacheKey)

      return cachedRequest
    }

    if (!ctx.request.url().includes('api-docs') && !ctx.request.url().includes('openapi')) {
      const cachedResponse = await cache.get({ key: cacheKey })
      if (cachedResponse) {
        ctx.logger.info({ cacheKey }, 'Serving from cache')
        return ctx.response.send(JSON.parse(cachedResponse))
      }
    }

    const response = await next()

    await this.cacheResponse(ctx, cacheKey)

    return response
  }

  private async cacheResponse(ctx: HttpContext, cacheKey: string) {
    if (ctx.response.getStatus() === 200) {
      await cache.set({
        key: cacheKey,
        value: JSON.stringify(ctx.response.getBody()),
        suppressL2Errors: true,
        ttl: '30d',
        tags: [ctx.request.url(false)],
      })
      ctx.logger.info({ cacheKey, tag: ctx.request.url(false) }, 'Response cached')
    }
  }
}
