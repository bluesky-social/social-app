/* eslint bsky-internal/avoid-unwrapped-text: 0 */ // --> OFF

import assert from 'node:assert'
import {once} from 'node:events'
import {createServer, IncomingMessage, ServerResponse} from 'node:http'

import * as starterPack from './routes/starter-pack.js'

const PORT = 3000

async function main() {
  const server = createServer(async (req, res) => {
    try {
      const url = req.url
        ? new URL(req.url, 'https://domain.invalid')
        : undefined
      assert(url)
      const pathParts =
        url.pathname === '/'
          ? []
          : url.pathname.slice(1).replace(/\/$/, '').split('/')
      const routed = await router(req, res, pathParts)
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
  })
  await once(server.listen(PORT), 'listening')
  console.log('listening')
  process.once('SIGINT', () => server.close())
  await once(server, 'close')
  console.log('closed')
}

async function router(
  req: IncomingMessage,
  res: ServerResponse,
  pathParts: string[],
) {
  if (
    req.method === 'GET' &&
    pathParts[0] === 'followers' &&
    pathParts.length === 2
  ) {
    await starterPack.handler(req, res, pathParts)
    return
  }
  return false
}

main()
