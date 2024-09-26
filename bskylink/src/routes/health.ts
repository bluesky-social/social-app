import {Express} from 'express'
import {sql} from 'kysely'

import {AppContext} from '../context.js'
import {handler} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/_health',
    handler(async (_req, res) => {
      const {version} = ctx.cfg.service
      try {
        await sql`select 1`.execute(ctx.db.db)
        return res.send({version})
      } catch (err) {
        return res.status(503).send({version, error: 'Service Unavailable'})
      }
    }),
  )
}
