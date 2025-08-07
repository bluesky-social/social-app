import events from 'node:events'
import type http from 'node:http'

import express from 'express'
import {createHttpTerminator, type HttpTerminator} from 'http-terminator'

import {type Config} from './config.js'
import {AppContext} from './context.js'
import {default as routes, errorHandler} from './routes/index.js'

export * from './config.js'
export * from './logger.js'

export class CardService {
  public server?: http.Server
  private terminator?: HttpTerminator

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {}

  static async create(cfg: Config): Promise<CardService> {
    let app = express()

    const ctx = await AppContext.fromConfig(cfg)
    app = routes(ctx, app)
    app.use(errorHandler)

    return new CardService(app, ctx)
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
  }
}
