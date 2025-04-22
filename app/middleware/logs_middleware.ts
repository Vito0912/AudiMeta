import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

export default class LogsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = DateTime.now()

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()

    void ctx.logger.info({
      message: 'Request completed',
      method: ctx.request.method(),
      url: ctx.request.url(),
      status: ctx.response.getStatus(),
      userAgent: ctx.request.header('user-agent'),
      took: Math.abs(startTime.diffNow().as('milliseconds')),
      ip:
        ctx.request.header('CF-Connecting-IP') ||
        ctx.request.header('x-real-ip') ||
        ctx.request.ip(),
    })

    return output
  }
}
