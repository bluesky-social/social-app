import {Database, envToCfg, httpLogger, LinkService, readEnv} from './index.js'

async function main() {
  try {
    httpLogger.info('Starting blink service')

    const env = readEnv()
    const cfg = envToCfg(env)

    httpLogger.info(
      {
        port: cfg.service.port,
        safelinkEnabled: cfg.service.safelinkEnabled,
        hasDbUrl: !!cfg.db.url,
        hasDbMigrationUrl: !!cfg.db.migrationUrl,
      },
      'Configuration loaded',
    )

    if (cfg.db.migrationUrl) {
      httpLogger.info('Running database migrations')
      const migrateDb = Database.postgres({
        url: cfg.db.migrationUrl,
        schema: cfg.db.schema,
      })
      await migrateDb.migrateToLatestOrThrow()
      await migrateDb.close()
      httpLogger.info('Database migrations completed')
    }

    httpLogger.info('Creating LinkService')
    const link = await LinkService.create(cfg)

    if (link.ctx.cfg.service.safelinkEnabled) {
      httpLogger.info('Starting Safelink client')
      link.ctx.safelinkClient.runFetchEvents()
    }

    await link.start()
    httpLogger.info('Link service is running')

    process.on('SIGTERM', async () => {
      httpLogger.info('Link service is stopping')
      await link.destroy()
      httpLogger.info('Link service is stopped')
    })
  } catch (error) {
    httpLogger.error(
      {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to start blink service',
    )
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled startup error:', error)
  process.exit(1)
})
