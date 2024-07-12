import {Express} from 'express'

import {AppContext} from '../context.js'
import {default as health} from './health.js'
import {default as starterPack} from './starter-pack.js'

export * from './util.js'

export default function (ctx: AppContext, app: Express) {
  app = health(ctx, app) // GET /_health
  app = starterPack(ctx, app) // GET /start/:actor/:rkey
  return app
}
