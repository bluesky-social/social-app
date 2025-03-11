import assert from 'node:assert'

import {DAY, SECOND} from '@atproto/common'
import {Express} from 'express'

import {AppContext} from '../context.js'
import {handler} from './util.js'

const INTERNAL_IP_REGEX = new RegExp(
  '(^127.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}$)|(^10.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.1[6-9]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.2[0-9]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.3[0-1]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^192.168.[0-9]{1,3}.[0-9]{1,3}$)|^localhost',
  'i',
)

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/redirect',
    handler(async (req, res) => {
      let link = req.query.u
      assert(
        typeof link === 'string',
        'express guarantees link query parameter is a string',
      )
      link = decodeURIComponent(link)

      let url: URL | undefined
      try {
        url = new URL(link)
      } catch {}

      if (
        !url ||
        (url.protocol !== 'http:' && url.protocol !== 'https:') || // is a http(s) url
        (ctx.cfg.service.hostnames.includes(url.hostname.toLowerCase()) &&
          url.pathname === '/redirect') || // is a redirect loop
        INTERNAL_IP_REGEX.test(url.hostname) // isn't directing to an internal location
      ) {
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Location', `https://${ctx.cfg.service.appHostname}`)
        return res.status(302).end()
      }

      res.setHeader('Cache-Control', `max-age=${(7 * DAY) / SECOND}`)
      res.setHeader('Location', url.href)
      return res.status(301).end()
    }),
  )
}
