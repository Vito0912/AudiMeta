import { defineConfig, store, drivers } from '@adonisjs/cache'
import env from '#start/env'

let cacheStore = store().useL1Layer(
  drivers.memory({
    maxEntrySize: '100kb',
    maxItems: 100000,
    maxSize: '100mb',
  })
)

if(env.get('REDIS_ENABLE')){
  cacheStore = cacheStore
    .useL2Layer(
      drivers.redis({
        connectionName: 'main',
      })
    )
    .useBus(drivers.redisBus({ connectionName: 'main' }))
}


const cacheConfig = defineConfig({
  default: 'default',

  stores: {
    default: cacheStore,
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
