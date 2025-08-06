import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Updating the "Accept" header to always accept "application/json" response
 * from the server. This will force the internals of the framework like
 * validator errors or auth errors to return a JSON response.
 */
export default class ForceJsonResponseMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const headers = request.headers()

    if (
      request.completeUrl(false).endsWith('/api-docs') &&
      headers.accept &&
      headers.accept.includes('application/json')
    ) {
      const nextContext = await next()

      try {
        const body = response.getBody()

        let parsedBody: any
        if (typeof body === 'string') {
          parsedBody = JSON.parse(body)
        } else {
          parsedBody = body
        }

        const modifiedBodyString = JSON.stringify(parsedBody)
          .replace(/:asin/g, '{asin}')
          .replace(/:sku/g, '{sku}')

        response.send(modifiedBodyString)
      } catch (error) {
        console.error('Failed to modify response body:', error)
        response.send('{"error": "Failed to modify response body"}')
        response.status(400)
      }

      return nextContext
    }

    if (request.completeUrl(false).endsWith('/api-docs')) {
      return next()
    }

    headers.accept = 'application/json'

    return next()
  }
}
