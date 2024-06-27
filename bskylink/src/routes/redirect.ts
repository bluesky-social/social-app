import assert from 'node:assert'

import {DAY, SECOND} from '@atproto/common'
import {Express} from 'express'

import {AppContext} from '../context.js'
import {handler} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/:linkId',
    handler(async (req, res) => {
      const linkId = req.params.linkId
      const acceptsJson = req.accepts('application/json')
      assert(
        typeof linkId === 'string',
        'express guarantees id parameter is a string',
      )
      const found = await ctx.db.db
        .selectFrom('link')
        .selectAll()
        .where('id', '=', linkId)
        .executeTakeFirst()
      if (!found) {
        // potentially broken or mistyped link
        res.setHeader('Cache-Control', 'no-store')
        if (acceptsJson) {
          return res.status(404).json({
            error: 'NotFound',
            message: 'Link not found',
          })
        }
        // send the user to the app
        res.setHeader('Location', `https://${ctx.cfg.service.appHostname}`)
        return res.status(302).end()
      }
      // build url from original url in order to preserve query params
      const url = new URL(
        req.originalUrl,
        `https://${ctx.cfg.service.appHostname}`,
      )
      url.pathname = found.path
      res.setHeader('Cache-Control', `max-age=${(7 * DAY) / SECOND}`)
      if (acceptsJson) {
        return res.json({url: url.href})
      }
      res.setHeader('Location', url.href)
      return res.status(301).end()
    }),
  )
}
