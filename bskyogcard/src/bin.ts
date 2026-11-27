import cluster from 'node:cluster'

import {envInt} from '@atproto/common'

import {CardCluster} from './cluster.js'
import {CardService, envToCfg, httpLogger, readEnv} from './index.js'
import {serveWorkerMetrics} from './metrics.js'
import {installShutdown} from './shutdown.js'

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
  const shutdown = installShutdown(async () => {
    stopMetrics()
    await card.destroy()
  })
  card.onFatalError = () => shutdown(1)
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
}

main().catch(err => {
  httpLogger.error({err}, 'card service startup failed')
  process.exitCode = 1
  if (cluster.isWorker) process.exit(1)
})
