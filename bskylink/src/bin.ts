import {
  Database,
  envToCfg,
  FORCE_SHUTDOWN_TIMEOUT_MS,
  httpLogger,
  LinkService,
  readEnv,
} from './index.js'

async function main() {
  try {
    httpLogger.info('Starting blink service')

    const env = readEnv()
    const cfg = envToCfg(env)

    httpLogger.info(
      {
        port: cfg.service.port,
        metricsPort: cfg.service.metricsPort,
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
      void link.ctx.safelinkClient.runFetchEvents()
    }

    await link.start()
    httpLogger.info('Link service is running')

    const shutdown = (signal: NodeJS.Signals) => {
      const forceExitTimer = setTimeout(() => {
        httpLogger.error(
          {signal},
          'Link service exceeded its shutdown deadline; forcing exit',
        )
        process.exit(1)
      }, FORCE_SHUTDOWN_TIMEOUT_MS)
      forceExitTimer.unref()

      void (async () => {
        httpLogger.info({signal}, 'Link service is stopping')
        try {
          await link.destroy()
          httpLogger.info({signal}, 'Link service is stopped')
        } catch (err) {
          process.exitCode = 1
          httpLogger.error({err, signal}, 'Failed to stop link service cleanly')
        }
      })()
    }

    process.once('SIGTERM', shutdown)
    process.once('SIGINT', shutdown)
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
