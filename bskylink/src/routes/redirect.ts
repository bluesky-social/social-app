import assert from 'node:assert'

import {ToolsOzoneSafelinkDefs} from '@atproto/api'
import {DAY, SECOND} from '@atproto/common'
import escapeHTML from 'escape-html'
import {type Express} from 'express'

import {type AppContext} from '../context.js'
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
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Location', `https://${ctx.cfg.service.appHostname}`)
        return res.status(200).end()
      }

      res.setHeader('Cache-Control', `max-age=${(7 * DAY) / SECOND}`)
      res.type('html')
      res.status(200)

      if (ctx.cfg.service.safelinkEnabled) {
        const rulePresent: ToolsOzoneSafelinkDefs.Event | undefined =
          ctx.cfg.eventCache.smartGet(link)

        // begin link safety checks
        if (
          rulePresent &&
          rulePresent.eventType === ToolsOzoneSafelinkDefs.REMOVERULE
        ) {
          redirectLogger.info(
            `No rule or Remove rule matched for ${rulePresent.url}`,
          )
          const escaped = escapeHTML(url.href)
          const html = safe_redirect(escaped)
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(html),
          })
          res.end(html) // Critical - must call end()
          return
        }

        if (
          rulePresent &&
          rulePresent.action === ToolsOzoneSafelinkDefs.WHITELIST
        ) {
          redirectLogger.info(`Whitelist rule matched for ${rulePresent.url}`)
          const escaped = escapeHTML(url.href)
          const html = safe_redirect(escaped)
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(html),
          })
          res.end(html) // Critical - must call end()
          return
        }

        if (
          rulePresent &&
          rulePresent.action === ToolsOzoneSafelinkDefs.BLOCK
        ) {
          redirectLogger.info(`Block rule matched for ${rulePresent.url}`)
          res.setHeader('Cache-Control', 'no-store')
          const html = warnRedirect(
            'Blocked Link',
            'This link has been identified as malicious, it has been blocked to protect your account and data',
            'Go Back To BlueSky',
            'DANGER',
            escapeHTML(url.toString()),
            `https://${ctx.cfg.service.appHostname}`,
          )
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(html),
          })
          res.end(html) // Critical - must call end()
          return
        }

        if (rulePresent && rulePresent.action === ToolsOzoneSafelinkDefs.WARN) {
          redirectLogger.info(`Warn rule matched for ${rulePresent.url}`)
          res.setHeader('Cache-Control', 'no-store')
          const html = warnRedirect(
            'Blocked Link',
            'This link has been identified as malicious, it has been blocked to protect your account and data',
            'Go Back To BlueSky',
            'DANGER',
            escapeHTML(url.toString()),
            `https://${ctx.cfg.service.appHostname}`,
          )
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(html),
          })
          res.end(html) // Critical - must call end()
          return
        }
      }

      const escaped = escapeHTML(url.href)
      const html = safe_redirect(escaped)
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(html),
      })
      res.end(html) // Critical - must call end()
      return
    }),
  )
}

const safe_redirect = (escaped: string) =>
  `<html><head>
    <meta http-equiv="refresh" content="0; URL='${escaped}'" />
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <style>:root { color-scheme: light dark; }</style>
  </head></html>`

const warnRedirect = (
  mainText: string,
  warningText: string,
  buttonText: string,
  reason: string,
  siteUrl: string,
  returnUrl = 'https://bsky.app',
) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0" />
      <meta http-equiv="Pragma" content="no-cache" />
      <meta http-equiv="Expires" content="0" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${mainText}</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }

          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #ffffff;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
          }

          .container {
              width: 100%;
              max-width: 400px;
              text-align: center;
          }

          .warning-icon {
              font-size: 48px;
              margin-bottom: 16px;
          }

          h1 {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #000000;
          }

          .warning-text {
              font-size: 15px;
              color: #536471;
              line-height: 1.4;
              margin-bottom: 24px;
              padding: 0 20px;
          }

          .blocked-site {
              background-color: #f7f9fa;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 24px;
              text-align: left;
              word-break: break-all;
          }

          .site-name {
              font-size: 16px;
              font-weight: 500;
              color: #000000;
              margin-bottom: 4px;
              word-break: break-word;
              display: block;
              text-align: center;
          }

          .site-url {
              font-size: 14px;
              color: #536471;
              word-break: break-all;
              display: block;
              text-align: center;
          }

          .back-button {
              background-color: #1d9bf0;
              color: white;
              border: none;
              border-radius: 24px;
              padding: 12px 32px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
              max-width: 280px;
              transition: background-color 0.2s;
          }

          .back-button:hover {
              background-color: #1a8cd8;
          }

          .back-button:active {
              background-color: #1681c4;
          }

          @media (max-width: 480px) {
              .warning-text {
                  padding: 0 10px;
              }
              .blocked-site {
                  padding: 8px;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="warning-icon">⚠️</div>
          <h1>${mainText}</h1>
          <p class="warning-text">${escapeHTML(warningText)}</p>
          <div class="blocked-site">
              <span class="site-name">${escapeHTML(reason)}</span>
              <span class="site-url">${escapeHTML(siteUrl)}</span>
          </div>
          <button class="back-button" id="redirect-button">${escapeHTML(
            buttonText,
          )}</button>
      </div>
      <script>
          document.getElementById('redirect-button').addEventListener('click', function() {
              window.location.href = ${JSON.stringify(returnUrl)};
          });
      </script>
  </body>
  </html>`
}
