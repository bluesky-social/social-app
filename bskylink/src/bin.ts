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
  await link.start()
  httpLogger.info('link service is running')
  process.on('SIGTERM', async () => {
    httpLogger.info('link service is stopping')
    await link.destroy()
    httpLogger.info('link service is stopped')
  })
}

main()
