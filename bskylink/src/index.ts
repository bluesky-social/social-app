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
        if (req.route) {
          return req.route.path
        }
        return '<unmatched>'
      },
    })
    app.use(metricsMiddleware)

    routes(ctx, app)
    app.use(errorHandler)

    return new LinkService(app, ctx)
  }

  async start() {
    // Start main HTTP server
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({server: this.server})
    await events.once(this.server, 'listening')

    // Start metrics server
    const metricsApp = express()
    metricsApp.get('/metrics', async (_req, res) => {
      try {
        const metrics = await register.metrics()
        res.set('Content-Type', register.contentType)
        res.end(metrics)
      } catch (error) {
        res.status(500).end('Error collecting metrics')
      }
    })

    this.metricsServer = metricsApp.listen(this.ctx.cfg.service.metricsPort)
    this.metricsTerminator = createHttpTerminator({server: this.metricsServer})
    await events.once(this.metricsServer, 'listening')
  }

  async destroy() {
    this.ctx.abortController.abort()
    await this.terminator?.terminate()
    await this.metricsTerminator?.terminate()
    await this.ctx.db.close()
  }
}
