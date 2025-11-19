import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

const loggerTargets = [
  ...targets().pushIf(!app.inProduction, targets.pretty()).toArray(),
  // Conditionally add Axiom only if enabled
  ...(env.get('AXIOM_ENABLE')
    ? [
        {
          target: '@axiomhq/pino',
          options: {
            dataset: env.get('AXIOM_DATASET'), // optional safe default
            token: env.get('AXIOM_TOKEN'),
          },
        },
      ]
    : []),
]

const loggerConfig = defineConfig({
  default: 'app',
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: loggerTargets,
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
