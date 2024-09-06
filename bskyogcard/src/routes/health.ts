import {Express} from 'express'

import {AppContext} from '../context.js'
import {handler} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/_health',
    handler(async (_req, res) => {
      const {version} = ctx.cfg.service
      return res.send({version})
    }),
  )
}
