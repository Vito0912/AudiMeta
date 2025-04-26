import { HttpContext } from '@adonisjs/core/http'
import InternalErrorException from '#exceptions/internal_error_exception'

export default async function retryOnUniqueViolation<T>(
  operation: () => Promise<T>,
  maxRetries = 10,
  delay = 150
): Promise<T> {
  let lastError: any

  const ctx = HttpContext.get()

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (
        error.message.includes('violates unique constraint') ||
        error.message.includes('deadlock')
      ) {
        if (ctx)
          void ctx.logger.warn({
            message: `Unique constraint violation, retrying...`,
            attempt,
          })

        let randomDelay = Math.floor(Math.random() * 100) + delay

        await new Promise((resolve) => setTimeout(resolve, randomDelay * attempt + 1))
        continue
      }

      ctx?.logger.error(error)
      throw new InternalErrorException(
        `There was an internal error. If you open an issue on GitHub, please provide a requestId: ${ctx?.request.id()}`
      )
    }
  }

  ctx?.logger.error(lastError)
  throw new InternalErrorException(
    `There was an internal error. If you open an issue on GitHub, please provide a requestId: ${ctx?.request.id()}`
  )
}
