import events from 'node:events'
import type http from 'node:http'

import express from 'express'
import promBundle from 'express-prom-bundle'
import {createHttpTerminator, type HttpTerminator} from 'http-terminator'
import {register} from 'prom-client'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './logger.js'

export class CardService {
  public server?: http.Server
  public metricsServer?: http.Server
  private terminator?: HttpTerminator
  private metricsTerminator?: HttpTerminator

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {}

  static async create(cfg: Config): Promise<CardService> {
    let app = express()

    const ctx = await AppContext.fromConfig(cfg)

    // Add Prometheus middleware for automatic HTTP instrumentation
    const metricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      includeStatusCode: true,
      includeUp: true,
      promClient: {
        collectDefaultMetrics: {},
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

    app = routes(ctx, app)
    app.use(errorHandler)

    return new CardService(app, ctx)
  }

  async start() {
    // Start main application server
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({
      server: this.server,
      gracefulTerminationTimeout: 15000, // 15s timeout for in-flight requests
    })
    await events.once(this.server, 'listening')

    // Start separate metrics server
    const metricsApp = express()
    metricsApp.get('/metrics', async (_req, res) => {
      res.set('Content-Type', register.contentType)
      res.end(await register.metrics())
    })

    this.metricsServer = metricsApp.listen(this.ctx.cfg.service.metricsPort)
    this.metricsTerminator = createHttpTerminator({
      server: this.metricsServer,
      gracefulTerminationTimeout: 2000, // 2s timeout for metrics server
    })
    await events.once(this.metricsServer, 'listening')
  }

  async destroy() {
    const startTime = Date.now()

    this.ctx.abortController.abort()

    const shutdownPromises = []

    if (this.terminator) {
      shutdownPromises.push(this.terminator.terminate())
    }

    if (this.metricsTerminator) {
      shutdownPromises.push(this.metricsTerminator.terminate())
    }

    await Promise.all(shutdownPromises)

    const elapsed = Date.now() - startTime
    const {httpLogger} = await import('./logger.js')
    httpLogger.info(`Graceful shutdown completed in ${elapsed}ms`)
  }
}
