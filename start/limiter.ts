/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const searchLimit = limiter.define('search', (ctx) => {
  const ip =
    ctx.request.header('CF-Connecting-IP') || ctx.request.header('x-real-ip') || ctx.request.ip()

  return limiter.allowRequests(50).every('1 minute').usingKey(`search:${ip}`)
})

export const itemLimit = limiter.define('item', (ctx) => {
  const ip =
    ctx.request.header('CF-Connecting-IP') || ctx.request.header('x-real-ip') || ctx.request.ip()

  return limiter.allowRequests(100).every('1 minute').usingKey(`item:${ip}`).blockFor('10 minutes')
})

export const extremeLimit = limiter.define('extreme', (ctx) => {
  const ip =
    ctx.request.header('CF-Connecting-IP') || ctx.request.header('x-real-ip') || ctx.request.ip()

  return limiter.allowRequests(10).every('1 minute').usingKey(`extreme:${ip}`)
})

export const cacheLimit = limiter.define('cache', (ctx) => {
  const cacheParam = ctx.request.input('cache')
  if (cacheParam === 'false') {
    const ip =
      ctx.request.header('CF-Connecting-IP') || ctx.request.header('x-real-ip') || ctx.request.ip()

    return limiter.allowRequests(10).every('1 minute').usingKey(`cache:${ip}`)
  }

  return limiter.noLimit()
})
