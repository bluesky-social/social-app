import events from 'node:events'
import http from 'node:http'

import cors from 'cors'
import express from 'express'
import {createHttpTerminator, HttpTerminator} from 'http-terminator'

import {Config} from './config.js'
import {AppContext} from './context.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './db/index.js'
export * from './logger.js'

export class LinkService {
  public server?: http.Server
  private terminator?: HttpTerminator

  constructor(public app: express.Application, public ctx: AppContext) {}

  static async create(cfg: Config): Promise<LinkService> {
    let app = express()
    app.use(cors())

    const ctx = await AppContext.fromConfig(cfg)
    app = routes(ctx, app)
    app.use(errorHandler)

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
