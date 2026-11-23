import {type Express} from 'express'

import {type AppContext} from '../context.js'
import {handler} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/',
    handler(async (_req, res) => {
      res.setHeader('Location', `https://${ctx.cfg.service.appHostname}`)
      return res.status(301).end()
    }),
  )
}
