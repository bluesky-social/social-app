import {envInt} from '@atproto/common'

import {envToCfg} from '../src/config.js'
import {CardService} from '../src/index.js'
import {serveWorkerMetrics} from '../src/metrics.js'

const slot = envInt('CARD_WORKER_SLOT')!
const card = await CardService.create(envToCfg({port: 0, metricsPort: 0}), slot)
card.app.get('/test/:value', (_req, res) => {
  res.json({worker: String(slot), pid: process.pid})
})
const stopMetrics = serveWorkerMetrics(card.registry)
await card.start({serveMetrics: false})
process.once('SIGTERM', async () => {
  stopMetrics()
  await card.destroy()
  process.exit(0)
})
