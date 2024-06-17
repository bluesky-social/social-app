import {Express} from 'express'

import {AppContext} from '../context.js'
import {default as create} from './create.js'
import {default as health} from './health.js'
import {default as redirect} from './redirect.js'

export * from './util.js'

export default function (ctx: AppContext, app: Express) {
  app = health(ctx, app) // GET /_health
  app = create(ctx, app) // POST /link
  app = redirect(ctx, app) // GET /:linkId (should go last due to permissive matching)
  return app
}
