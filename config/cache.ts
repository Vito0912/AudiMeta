import { defineConfig, store, drivers } from '@adonisjs/cache'

const cacheConfig = defineConfig({
  default: 'default',

  stores: {
    default: store()
      .useL1Layer(
        drivers.memory({
          maxEntrySize: '100kb',
          maxItems: 100000,
          maxSize: '100mb',
        })
      )
      .useL2Layer(
        drivers.redis({
          connectionName: 'main',
        })
      )
      .useBus(drivers.redisBus({ connectionName: 'main' })),
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
