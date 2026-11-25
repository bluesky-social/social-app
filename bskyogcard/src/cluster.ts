import cluster, {type Worker} from 'node:cluster'
import {type Server} from 'node:http'

import {Counter, Gauge, Registry} from 'prom-client'

import {httpLogger} from './logger.js'
import {collectWorkerMetrics, startMetricsServer} from './metrics.js'
import {RenderPool} from './render/pool.js'
import {
  isMessage,
  isRenderJob,
  RENDER_CANCEL,
  RENDER_REQUEST,
  RENDER_RESULT,
  RenderUnavailableError,
  serializeRenderError,
  type RenderResult,
} from './render/protocol.js'

/** Owns the worker roster and the cluster's single metrics listener. */
export class CardCluster {
  readonly registry = new Registry()
  metricsServer?: Server
  private workers = new Set<Worker>()
  private ready = new Set<Worker>()
  private abortController = new AbortController()
  private stopping = false
  private pendingMetrics?: Promise<string>
  private stopMetrics?: () => Promise<void>
  private shutdown?: Promise<void>
  private restarts: Counter<'worker'>
  private metricsPort: number
  private workerCount: number
  private renderers: RenderPool

  constructor(metricsPort: number, workerCount: number) {
    if (!Number.isSafeInteger(workerCount) || workerCount < 1) {
      throw new RangeError('Worker count must be a positive integer')
    }
    this.metricsPort = metricsPort
    this.workerCount = workerCount
    this.renderers = new RenderPool(workerCount, this.registry)
    const workers = this.workers
    new Gauge({
      name: 'bskyogcard_workers_live',
      help: 'Worker processes with a connected IPC channel, not application readiness.',
      registers: [this.registry],
      collect() {
        this.set(
          [...workers].filter(
            worker => worker.isConnected() && !worker.isDead(),
          ).length,
        )
      },
    })
    new Gauge({
      name: 'bskyogcard_workers_expected',
      help: 'Configured number of worker processes.',
      registers: [this.registry],
    }).set(workerCount)
    this.restarts = new Counter({
      name: 'bskyogcard_worker_restarts_total',
      help: 'Unexpected worker exits requiring replacement, by stable worker slot.',
      labelNames: ['worker'],
      registers: [this.registry],
    })
    for (let slot = 0; slot < workerCount; slot++) {
      this.restarts.labels(String(slot)).inc(0)
    }
  }

  async start() {
    // Preserve non-finite metric values rather than JSON-converting them to null.
    cluster.setupPrimary({...cluster.settings, serialization: 'advanced'})
    const metrics = await startMetricsServer(
      this.metricsPort,
      this.registry.contentType,
      () => this.collect(),
    )
    this.metricsServer = metrics.server
    this.stopMetrics = metrics.stop
    for (let slot = 0; slot < this.workerCount; slot++) this.fork(slot)
  }

  private fork(slot: number) {
    const worker = cluster.fork({CARD_WORKER_SLOT: String(slot)})
    this.workers.add(worker)
    const renders = new Map<number, AbortController>()
    const cancelRenders = () => {
      for (const controller of renders.values()) controller.abort()
      renders.clear()
    }
    const reply = (message: RenderResult) => {
      if (!worker.isConnected()) return
      try {
        worker.send(message, () => {})
      } catch {}
    }
    const onMessage = (message: unknown) => {
      if (
        !isMessage(message) ||
        typeof message.id !== 'number' ||
        !Number.isSafeInteger(message.id)
      )
        return
      const {id} = message
      if (message.type === RENDER_CANCEL) {
        renders.get(id)?.abort()
        return
      }
      if (message.type !== RENDER_REQUEST) return
      // Accepted HTTP requests may reach rendering during the shutdown drain.
      if (renders.size > 0 || !isRenderJob(message.job)) {
        reply({
          type: RENDER_RESULT,
          id,
          error: serializeRenderError(
            new RenderUnavailableError('Render request cannot be accepted'),
          ),
        })
        return
      }
      const controller = new AbortController()
      renders.set(id, controller)
      void this.renderers
        .render(message.job, controller.signal)
        .then(
          png => reply({type: RENDER_RESULT, id, png}),
          err =>
            reply({type: RENDER_RESULT, id, error: serializeRenderError(err)}),
        )
        .finally(() => renders.delete(id))
    }
    worker.on('message', onMessage)
    worker.once('disconnect', cancelRenders)
    const onListening = () => this.ready.add(worker)
    const onError = (err: Error) => {
      if (!this.stopping) {
        httpLogger.error({err, worker: slot}, 'worker IPC error')
      }
    }
    worker.on('listening', onListening)
    worker.on('error', onError)
    worker.once('exit', (code, signal) => {
      cancelRenders()
      worker.off('message', onMessage)
      worker.off('disconnect', cancelRenders)
      worker.off('listening', onListening)
      worker.off('error', onError)
      this.ready.delete(worker)
      this.workers.delete(worker)
      if (!this.stopping) {
        this.restarts.labels(String(slot)).inc()
        httpLogger.error(
          {worker: slot, code, signal},
          'replacing exited worker',
        )
        this.fork(slot)
      }
    })
  }

  private async collect() {
    if (
      this.stopping ||
      this.workers.size !== this.workerCount ||
      this.ready.size !== this.workerCount
    ) {
      throw new Error('Worker metrics are not ready')
    }
    this.pendingMetrics ??= collectWorkerMetrics(
      [...this.workers],
      this.abortController.signal,
    )
      .then(registry => Registry.merge([this.registry, registry]).metrics())
      .finally(() => {
        this.pendingMetrics = undefined
      })
    return this.pendingMetrics
  }

  destroy() {
    this.shutdown ??= this.stop()
    return this.shutdown
  }

  private async stop() {
    this.stopping = true
    this.abortController.abort()
    const exited = Promise.all(
      [...this.workers].map(
        worker =>
          new Promise<void>(resolve => {
            worker.once('exit', () => resolve())
            worker.kill('SIGTERM')
          }),
      ),
    )
    // Allow the application's 15-second drain, then reap stuck workers as well.
    const deadline = setTimeout(() => {
      for (const worker of this.workers) worker.kill('SIGKILL')
    }, 17000)
    try {
      const results = await Promise.allSettled([exited, this.stopMetrics?.()])
      for (const result of results) {
        if (result.status === 'rejected') throw result.reason
      }
    } finally {
      clearTimeout(deadline)
      await this.renderers.destroy()
    }
  }
}
