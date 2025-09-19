import events from 'node:events'
import type http from 'node:http'

import cors from 'cors'
import express, {type Response} from 'express'
import {createHttpTerminator, type HttpTerminator} from 'http-terminator'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import i18n from './i18n.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './db/index.js'
export * from './logger.js'

export class LinkService {
  public server?: http.Server
  private terminator?: HttpTerminator

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {}

  static async create(cfg: Config): Promise<LinkService> {
    let app = express()
    app.use(cors())
    app.use(i18n.init)

    const ctx = await AppContext.fromConfig(cfg)
    app = routes(ctx, app)
    app.use(errorHandler)

    // request duration logging
    app.use((req, res, next) => {
      const start = process.hrtime.bigint()
      const originalEnd = res.end.bind(res) as Response['end']
      res.end = function (
        this: Response,
        ...args: Parameters<Response['end']>
      ): ReturnType<Response['end']> {
        const end = process.hrtime.bigint()
        const respTimeMs = Number(end - start) / 1_000_000 // ns to ms :3

        if (req.route) {
          ctx.metrics
            .getHistogram('requestDuration')
            .labels(req.route.path, req.method, res.statusCode.toString())
            .observe(respTimeMs)
        }

        return originalEnd(...args)
      } as Response['end']
      next()
    })

    return new LinkService(app, ctx)
  }

  async start() {
    this.server = this.app.listen(this.ctx.cfg.service.port)
    this.server.keepAliveTimeout = 90000
    this.terminator = createHttpTerminator({server: this.server})
    await events.once(this.server, 'listening')
  }

  async destroy() {
    this.ctx.abortController.abort()
    await this.terminator?.terminate()
    await this.ctx.db.close()
  }
}
