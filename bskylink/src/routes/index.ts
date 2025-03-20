import {Express} from 'express'

import {AppContext} from '../context.js'
import {default as createShortLink} from './createShortLink.js'
import {default as health} from './health.js'
import {default as redirect} from './redirect.js'
import {default as root} from './root.js'
import {default as shortLink} from './shortLink.js'
import {default as siteAssociation} from './siteAssociation.js'

export * from './util.js'

export default function (ctx: AppContext, app: Express) {
  app = health(ctx, app) // GET /_health
  app = siteAssociation(ctx, app) // GET /.well-known/apple-app-site-association
  app = redirect(ctx, app) // GET /redirect
  app = createShortLink(ctx, app) // POST /link
  app = root(ctx, app) // GET / (redirect to bsky.app on root)
  app = shortLink(ctx, app) // GET /:linkId (should go last due to permissive matching)
  return app
}
