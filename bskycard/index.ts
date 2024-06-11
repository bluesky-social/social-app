/* eslint bsky-internal/avoid-unwrapped-text: 0 */ // --> OFF

import assert from 'node:assert'
import {once} from 'node:events'
import {readFileSync} from 'node:fs'
import {createServer, IncomingMessage, ServerResponse} from 'node:http'

import {AtpAgent} from '@atproto/api'

import {AppContext} from './context.js'
import * as starterPack from './routes/starter-pack.js'

const PORT = 3000

async function main() {
  const ctx: AppContext = {
    appviewAgent: new AtpAgent({service: 'https://api.bsky.app'}),
    fonts: [{name: 'Inter', data: readFileSync('./assets/Inter-Regular.ttf')}],
  }
  const server = createServer((req, res) => handler(ctx, req, res))
  await once(server.listen(PORT), 'listening')
  console.log('listening')
  process.once('SIGINT', () => server.close())
  await once(server, 'close')
  console.log('closed')
}

async function handler(
  ctx: AppContext,
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const url = req.url ? new URL(req.url, 'https://domain.invalid') : undefined
    assert(url)
    const pathParts =
      url.pathname === '/'
        ? []
        : url.pathname.slice(1).replace(/\/$/, '').split('/')
    const routed = await router(ctx, req, res, pathParts)
    if (routed === false) {
      res.statusCode = 404
      res.setHeader('content-type', 'text/plain')
      return res.end('not found')
    }
  } catch (err) {
    console.error(err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('content-type', 'text/plain')
      return res.end('server error')
    }
  }
}

async function router(
  ctx: AppContext,
  req: IncomingMessage,
  res: ServerResponse,
  pathParts: string[],
) {
  if (
    req.method === 'GET' &&
    pathParts[0] === 'followers' &&
    pathParts.length === 2
  ) {
    await starterPack.handler(ctx, req, res, pathParts)
    return
  }
  return false
}

main()
