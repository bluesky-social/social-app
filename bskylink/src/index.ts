import events from 'node:events'
import type http from 'node:http'

import cors from 'cors'
import express from 'express'
import {createHttpTerminator, type HttpTerminator} from 'http-terminator'
import {type Registry} from 'prom-client'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import i18n from './i18n.js'
import {createPrometheusRegistry} from './prometheus.js'
import {default as routes, errorHandler} from './routes/index.js'
import {REQUEST_DRAIN_TIMEOUT_MS} from './shutdown.js'

export * from './config.js'
export * from './db/index.js'
export * from './logger.js'
export * from './shutdown.js'

export class LinkService {
  public server?: http.Server
  public metricsServer?: http.Server
  private terminator?: HttpTerminator
  private metricsTerminator?: HttpTerminator
  private metricsRegistry: Registry
  private destroyPromise?: Promise<void>

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {
    this.metricsRegistry = createPrometheusRegistry(ctx)
  }

  static async create(cfg: Config): Promise<LinkService> {
    let app = express()
    app.use(cors())
    app.use(i18n.init)

    const ctx = await AppContext.fromConfig(cfg)
    app = routes(ctx, app)
    app.use(errorHandler)

    return new LinkService(app, ctx)
  }

  async start() {
    this.ctx.metrics.start()
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({
      server: this.server,
      gracefulTerminationTimeout: REQUEST_DRAIN_TIMEOUT_MS,
    })
    await events.once(this.server, 'listening')

    const metricsApp = express()
    metricsApp.get('/metrics', (_req, res, next) => {
      res.set('Content-Type', this.metricsRegistry.contentType)
      this.metricsRegistry.metrics().then(metrics => res.end(metrics), next)
    })
    this.metricsServer = metricsApp.listen(this.ctx.cfg.service.metricsPort)
    this.metricsTerminator = createHttpTerminator({
      server: this.metricsServer,
      gracefulTerminationTimeout: 2000,
    })
    await events.once(this.metricsServer, 'listening')
  }

  destroy(): Promise<void> {
    this.destroyPromise ??= this.destroyInternal()

    return this.destroyPromise
  }

  private async destroyInternal() {
    this.ctx.abortController.abort()
    try {
      await Promise.all([
        this.terminator?.terminate(),
        this.metricsTerminator?.terminate(),
        this.ctx.safelinkClient.stop(REQUEST_DRAIN_TIMEOUT_MS),
      ])
    } finally {
      try {
        await this.ctx.db.close()
      } finally {
        this.ctx.metrics.stop()
      }
    }
  }
}
