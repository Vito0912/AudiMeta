/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.enum(['postgres', 'mysql'] as const),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  DEVICE_ID: Env.schema.string(),
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),

  REDIS_ENABLE: Env.schema.boolean(),

  REDIS_HOST: Env.schema.string({ format: 'host' }),

  REDIS_PORT: Env.schema.number.optionalWhen((_key, _value) => {
    return !Boolean(process.env.LIMITER_STORE === 'redis')
  }),

  REDIS_PASSWORD: Env.schema.string.optional(),

  AXIOM_ENABLE: Env.schema.boolean(),

  AXIOM_DATASET: Env.schema.string.optionalWhen((_key, _value) => {
    return Boolean(process.env.AXIOM_ENABLE != 'true')
  }),

  AXIOM_TOKEN: Env.schema.string.optionalWhen((_key, _value) => {
    return Boolean(process.env.AXIOM_ENABLE != 'true')
  }),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */

  RATE_SEARCH: Env.schema.number(),

  RATE_ITEM: Env.schema.number(),

  RATE_EXTREME: Env.schema.number(),

  RATE_CACHE: Env.schema.number(),

  RATE_SERIES: Env.schema.number(),

  BLACKLISTED_USER_AGENTS: Env.schema.string.optional(),
})
