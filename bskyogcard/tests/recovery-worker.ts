import cluster from 'node:cluster'
import {type AddressInfo} from 'node:net'

import {envToCfg} from '../src/config.js'
import {CardService} from '../src/index.js'
import {serveWorkerMetrics} from '../src/metrics.js'
import {errorHandler, handler} from '../src/routes/util.js'
import {installShutdown} from '../src/shutdown.js'

const card = await CardService.create(envToCfg({port: 0, metricsPort: 0}))
card.app.get('/pid', (_req, res) => res.json({pid: process.pid}))
let releaseSlow: (() => void) | undefined
card.app.get('/slow', (_req, res) => {
  releaseSlow = () => res.end('drained')
  process.send?.({type: 'slow-started'})
})
process.on('message', message => {
  if (message === 'release-slow') releaseSlow?.()
})
card.app.get(
  '/failure/:kind',
  handler(async (req, res) => {
    if (req.params.kind === 'diagnostics') {
      res.locals.renderErrorContext = () => {
        throw new Error('simulated diagnostics failure')
      }
    }
    if (req.params.kind !== 'ordinary') {
      throw new WebAssembly.RuntimeError('simulated renderer trap')
    }
    throw new Error('simulated ordinary failure')
  }),
)
card.app.use(errorHandler(() => card.onFatalError?.()))
const stopMetrics = cluster.isWorker
  ? serveWorkerMetrics(card.registry)
  : () => {}
const shutdown = installShutdown(async () => {
  stopMetrics()
  await card.destroy()
})
card.onFatalError = () => shutdown(1)
await card.start({serveMetrics: !cluster.isWorker})
process.send?.({port: (card.server!.address() as AddressInfo).port})
