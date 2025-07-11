import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

export default class RequireUseragentMiddleware {
  private static blacklist: string[] = (env.get('BLACKLISTED_USER_AGENTS', '') as string)
    .split(',')
    .map((ua) => ua.trim())
    .filter((ua) => ua.length > 0)

  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    const userAgent = ctx.request.header('user-agent')?.trim() || ''
    if (!userAgent) {
      ctx.logger.warn('Request without user-agent header')
      ctx.response.status(403).send({
        error:
          'A User-Agent header is required to prevent spam. Generic User-Agents will have a lower rate limit. Please see https://www.rfc-editor.org/rfc/rfc9110#name-user-agent for guidance on crafting a proper User-Agent.',
      })
      return
    }

    if (RequireUseragentMiddleware.blacklist.some((ua) => userAgent.startsWith(ua))) {
      ctx.logger.warn(`Request with blacklisted User-Agent: ${userAgent}`)
      ctx.response.status(403).send({
        error: 'This User-Agent is blacklisted. Please open an issue to resolve this.',
      })
      return
    }

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
