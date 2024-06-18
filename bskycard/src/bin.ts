import cluster, {Worker} from 'node:cluster'

import {envInt} from '@atproto/common'

import {CardService, envToCfg, httpLogger, readEnv} from './index.js'

async function main() {
  const env = readEnv()
  const cfg = envToCfg(env)
  const card = await CardService.create(cfg)
  await card.start()
  httpLogger.info('card service is running')
  process.on('SIGTERM', async () => {
    httpLogger.info('card service is stopping')
    await card.destroy()
    httpLogger.info('card service is stopped')
    if (cluster.isWorker) process.exit(0)
  })
}

const workerCount = envInt('CARD_CLUSTER_WORKER_COUNT')

if (workerCount) {
  if (cluster.isPrimary) {
    httpLogger.info(`primary ${process.pid} is running`)
    const workers = new Set<Worker>()
    for (let i = 0; i < workerCount; ++i) {
      workers.add(cluster.fork())
    }
    let teardown = false
    cluster.on('exit', worker => {
      workers.delete(worker)
      if (!teardown) {
        workers.add(cluster.fork()) // restart on crash
      }
    })
    process.on('SIGTERM', () => {
      teardown = true
      httpLogger.info('disconnecting workers')
      workers.forEach(w => w.kill('SIGTERM'))
    })
  } else {
    httpLogger.info(`worker ${process.pid} is running`)
    main()
  }
} else {
  main() // non-clustering
}
