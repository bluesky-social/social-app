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
      // Don't expose /metrics on main app - we'll use separate server
      autoregister: false,
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
    this.terminator = createHttpTerminator({server: this.server})
    await events.once(this.server, 'listening')

    // Start separate metrics server
    const metricsApp = express()
    metricsApp.get('/metrics', (_req, res) => {
      res.set('Content-Type', register.contentType)
      res.end(register.metrics())
    })

    this.metricsServer = metricsApp.listen(this.ctx.cfg.service.metricsPort)
    this.metricsTerminator = createHttpTerminator({server: this.metricsServer})
    await events.once(this.metricsServer, 'listening')
  }

  async destroy() {
    this.ctx.abortController.abort()
    await this.terminator?.terminate()
    await this.metricsTerminator?.terminate()
  }
}
