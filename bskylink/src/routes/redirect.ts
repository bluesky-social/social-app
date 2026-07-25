import assert from 'node:assert'

import {DAY, SECOND} from '@atproto/common'
import {type Express} from 'express'

import {type AppContext} from '../context.js'
import {linkRedirectContents} from '../html/linkRedirectContents.js'
import {linkWarningContents} from '../html/linkWarningContents.js'
import {linkWarningLayout} from '../html/linkWarningLayout.js'
import {redirectLogger} from '../logger.js'
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
        ctx.metrics.track('invalid_redirect', {link})
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Location', `https://${ctx.cfg.service.appHostname}`)
        return res.status(302).end()
      }

      // Default to a max age header
      res.setHeader('Cache-Control', `max-age=${(7 * DAY) / SECOND}`)
      res.status(200)
      res.type('html')

      let html: string | undefined
      let whitelisted: 'unknown' | 'yes' = 'unknown'
      let blocked: boolean = false
      let warned: boolean = false

      if (ctx.cfg.service.safelinkEnabled) {
        const rule = await ctx.safelinkClient.tryFindRule(link)
        if (rule !== 'ok') {
          switch (rule.action) {
            case 'whitelist':
              redirectLogger.info({rule}, 'Whitelist rule matched')
              whitelisted = 'yes'
              break
            case 'block':
              html = linkWarningLayout(
                'Blocked Link Warning',
                linkWarningContents(req, {
                  type: 'block',
                  link: url.href,
                }),
              )
              res.setHeader('Cache-Control', 'no-store')
              redirectLogger.info({rule}, 'Block rule matched')
              blocked = true
              break
            case 'warn':
              html = linkWarningLayout(
                'Malicious Link Warning',
                linkWarningContents(req, {
                  type: 'warn',
                  link: url.href,
                }),
              )
              res.setHeader('Cache-Control', 'no-store')
              redirectLogger.info({rule}, 'Warn rule matched')
              warned = true
              break
            default:
              redirectLogger.warn({rule}, 'Unknown rule matched')
          }
        }
      }

      // If there is no html defined yet, we will create a redirect html
      if (!html) {
        html = linkRedirectContents(url.href)
      }

      ctx.metrics.track('redirect', {
        link,
        whitelisted,
        blocked,
        warned,
        utm_source: req.query.utm_source?.toString(),
        utm_medium: req.query.utm_medium?.toString(),
        utm_campaign: req.query.utm_campaign?.toString(),
        utm_content: req.query.utm_content?.toString(),
        utm_term: req.query.utm_term?.toString(),
      })

      return res.end(html)
    }),
  )
}
