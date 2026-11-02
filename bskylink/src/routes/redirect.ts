import assert from 'node:assert'

import {HOUR, SECOND} from '@atproto/common'
import {type Express} from 'express'

import {type AppContext} from '../context.js'
import {linkRedirectContents} from '../html/linkRedirectContents.js'
import {linkWarningContents} from '../html/linkWarningContents.js'
import {linkWarningLayout} from '../html/linkWarningLayout.js'
import {redirectLogger} from '../logger.js'
import {observedHandler} from './util.js'

const INTERNAL_IP_REGEX = new RegExp(
  '(^127.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}$)|(^10.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.1[6-9]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.2[0-9]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^172.3[0-1]{1}[0-9]{0,1}.[0-9]{1,3}.[0-9]{1,3}$)|(^192.168.[0-9]{1,3}.[0-9]{1,3}$)|^localhost',
  'i',
)

/**
 * Only plain string query params are tracked, since repeated or nested params
 * parse to arrays or objects.
 */
const queryString = (value: unknown) =>
  typeof value === 'string' ? value : undefined

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/redirect',
    observedHandler('redirect', async (req, res) => {
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

      /*
       * A cached response bypasses rules added after it was cached, so only
       * explicitly whitelisted links get a (short) max age.
       */
      res.setHeader('Cache-Control', 'no-store')
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
              res.setHeader('Cache-Control', `max-age=${HOUR / SECOND}`)
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
        utm_source: queryString(req.query.utm_source),
        utm_medium: queryString(req.query.utm_medium),
        utm_campaign: queryString(req.query.utm_campaign),
        utm_content: queryString(req.query.utm_content),
        utm_term: queryString(req.query.utm_term),
      })

      return res.end(html)
    }),
  )
}
