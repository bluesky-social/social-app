import events from 'node:events'
import type http from 'node:http'

import express from 'express'
import promBundle from 'express-prom-bundle'
import {Registry} from 'prom-client'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import {startMetricsServer} from './metrics.js'
import {createRenderer} from './render/client.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './logger.js'

export class CardService {
  public server?: http.Server
  public metricsServer?: http.Server
  private stopMetrics?: () => Promise<void>
  private draining = false
  private shutdown?: Promise<void>

  public app: express.Application
  public ctx: AppContext
  readonly registry: Registry
  onFatalError?: () => void

  constructor(app: express.Application, ctx: AppContext, registry: Registry) {
    this.app = app
    this.ctx = ctx
    this.registry = registry
  }

  static async create(cfg: Config, workerSlot = 0): Promise<CardService> {
    const app = express()

    const registry = new Registry()
    registry.setDefaultLabels({worker: String(workerSlot)})
    const ctx = await AppContext.fromConfig(cfg, {
      renderer: createRenderer(registry),
    })

    // Add Prometheus middleware for automatic HTTP instrumentation
    const metricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      includeStatusCode: true,
      // Scrapers provide target-level up; do not add a second up per worker.
      includeUp: false,
      promRegistry: registry,
      promClient: {
        collectDefaultMetrics: {register: registry},
      },

      autoregister: false,
      normalizePath: req => {
        // If we have a matched route, use its path (with :params) instead of the full URL path
        if (req.route) {
          return req.route.path
        }

        // Group all unmatched paths together to reduce cardinality
        return '<unmatched>'
      },
    })
    app.use(metricsMiddleware)

    const service = new CardService(app, ctx, registry)
    app.use((_req, res, next) => {
      if (service.draining) {
        return res
          .status(503)
          .set('connection', 'close')
          .end('service unavailable')
      }
      next()
    })
    routes(ctx, app)
    app.use(errorHandler(() => service.onFatalError?.()))
    return service
  }

  async start({serveMetrics = true} = {}) {
    // Start main application server
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    await events.once(this.server, 'listening')

    if (serveMetrics) {
      const metrics = await startMetricsServer(
        this.ctx.cfg.service.metricsPort,
        this.registry.contentType,
        () => this.registry.metrics(),
      )
      this.metricsServer = metrics.server
      this.stopMetrics = metrics.stop
    }
  }

  destroy() {
    this.shutdown ??= this.stop()
    return this.shutdown
  }

  private async stop() {
    this.draining = true
    const startTime = Date.now()

    this.ctx.abortController.abort()

    const shutdownPromises = []
    const server = this.server
    if (server?.listening) {
      shutdownPromises.push(
        new Promise<void>((resolve, reject) => {
          const deadline = setTimeout(() => server.closeAllConnections(), 15000)
          server.close(err => {
            clearTimeout(deadline)
            if (err) reject(err)
            else resolve()
          })
        }),
      )
    }

    if (this.stopMetrics) {
      shutdownPromises.push(this.stopMetrics())
    }

    try {
      await Promise.all(shutdownPromises)
    } finally {
      await this.ctx.renderer.destroy()
    }

    const elapsed = Date.now() - startTime
    const {httpLogger} = await import('./logger.js')
    httpLogger.info(`Graceful shutdown completed in ${elapsed}ms`)
  }
}
