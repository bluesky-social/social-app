import {adaptiveFetchAndUpdate, eventCache} from './cache/cache.js'
import {Database, envToCfg, httpLogger, LinkService, readEnv} from './index.js'
async function main() {
  const env = readEnv()
  const cfg = envToCfg(env)
  if (cfg.db.migrationUrl) {
    const migrateDb = Database.postgres({
      url: cfg.db.migrationUrl,
      schema: cfg.db.schema,
    })
    await migrateDb.migrateToLatestOrThrow()
    await migrateDb.close()
  }

  const link = await LinkService.create(cfg)

  if (cfg.service.safelink === 1) {
    eventCache.init(cfg.service)
    adaptiveFetchAndUpdate()
  }

  await link.start()
  httpLogger.info('link service is running')
  console.log('running service')
  process.on('SIGTERM', async () => {
    httpLogger.info('link service is stopping')
    await link.destroy()
    httpLogger.info('link service is stopped')
  })
}

main()
