import events from 'node:events'
import type http from 'node:http'

import cors from 'cors'
import express from 'express'
import promBundle from 'express-prom-bundle'
import {createHttpTerminator, type HttpTerminator} from 'http-terminator'
import {register} from 'prom-client'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import i18n from './i18n.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './db/index.js'
export * from './logger.js'

export class LinkService {
  public server?: http.Server
  public metricsServer?: http.Server
  private terminator?: HttpTerminator
  private metricsTerminator?: HttpTerminator

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {}

  static async create(cfg: Config): Promise<LinkService> {
    let app = express()
    app.use(cors())
    app.use(i18n.init)

    app.use(
      promBundle({
        autoregister: false,
        includeMethod: true,
        includePath: true,
        includeStatusCode: true,
        includeUp: true,
        normalizePath: req => {
          const route = req.route as {path?: unknown} | undefined
          return typeof route?.path === 'string' ? route.path : '<unmatched>'
        },
        promClient: {
          collectDefaultMetrics: {},
        },
      }),
    )

    const ctx = await AppContext.fromConfig(cfg)
    app = routes(ctx, app)
    app.use(errorHandler)

    return new LinkService(app, ctx)
  }

  async start() {
    this.ctx.metrics.start()
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({server: this.server})
    await events.once(this.server, 'listening')

    const metricsApp = express()
    metricsApp.get('/metrics', (_req, res, next) => {
      res.set('Content-Type', register.contentType)
      register.metrics().then(metrics => res.end(metrics), next)
    })
    this.metricsServer = metricsApp.listen(this.ctx.cfg.service.metricsPort)
    this.metricsTerminator = createHttpTerminator({
      server: this.metricsServer,
      gracefulTerminationTimeout: 2000,
    })
    await events.once(this.metricsServer, 'listening')
  }

  async destroy() {
    this.ctx.abortController.abort()
    await Promise.all([
      this.terminator?.terminate(),
      this.metricsTerminator?.terminate(),
    ])
    await this.ctx.db.close()
    this.ctx.metrics.stop()
  }
}
