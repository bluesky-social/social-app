import {type Express} from 'express'

import {type AppContext} from '../context.js'
import {observedHandler} from './util.js'

/**
 * Looks up the Safelink rule for a URL, using the same lookup as `/redirect`.
 * Lets the app refuse links Safelink blocks before they're saved, such as
 * profile links. Only the action is returned; rule details stay internal.
 */
export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/safelink/check',
    observedHandler('safelink_check', async (req, res) => {
      const link = req.query.u
      let url: URL | undefined
      try {
        url = typeof link === 'string' ? new URL(link) : undefined
      } catch {}
      if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
        return res.status(400).json({
          error: 'InvalidUrl',
          message: '"u" parameter must be an http(s) URL',
        })
      }

      // a cached answer would outlive a newly added rule
      res.setHeader('Cache-Control', 'no-store')
      if (!ctx.cfg.service.safelinkEnabled) {
        return res.json({action: 'none'})
      }
      const rule = await ctx.safelinkClient.tryFindRule(url.href)
      return res.json({action: rule === 'ok' ? 'none' : rule.action})
    }),
  )
}
