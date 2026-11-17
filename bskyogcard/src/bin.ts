import cluster from 'node:cluster'

import {envInt} from '@atproto/common'

import {CardCluster} from './cluster.js'
import {CardService, envToCfg, httpLogger, readEnv} from './index.js'
import {serveWorkerMetrics} from './metrics.js'

async function main() {
  const cfg = envToCfg(readEnv())
  const workerCount = envInt('CARD_CLUSTER_WORKER_COUNT')
  if (workerCount && cluster.isPrimary) {
    httpLogger.info(`primary ${process.pid} is running`)
    const service = new CardCluster(cfg.service.metricsPort, workerCount)
    try {
      await service.start()
    } catch (err) {
      await service.destroy()
      throw err
    }
    installShutdown(() => service.destroy())
    return
  }

  const workerSlot = cluster.isWorker ? envInt('CARD_WORKER_SLOT') : 0
  const card = await CardService.create(cfg, workerSlot)
  const stopMetrics = cluster.isWorker
    ? serveWorkerMetrics(card.registry)
    : () => {}
  try {
    await card.start({serveMetrics: !cluster.isWorker})
  } catch (err) {
    stopMetrics()
    await card.destroy()
    throw err
  }
  httpLogger.info(
    {worker: workerSlot},
    `card service ${process.pid} is running`,
  )
  installShutdown(async () => {
    stopMetrics()
    await card.destroy()
  })
}

function installShutdown(destroy: () => Promise<void>) {
  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    void destroy().then(
      () => {
        httpLogger.info('card service is stopped')
        if (cluster.isWorker) process.exit(0)
      },
      err => {
        httpLogger.error({err}, 'card service shutdown failed')
        process.exitCode = 1
        if (cluster.isWorker) process.exit(1)
      },
    )
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch(err => {
  httpLogger.error({err}, 'card service startup failed')
  process.exitCode = 1
  if (cluster.isWorker) process.exit(1)
})
