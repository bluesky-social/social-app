import assert from 'node:assert'

import bodyParser from 'body-parser'
import {type Express, type Request} from 'express'

import {type AppContext} from '../context.js'
import {LinkType} from '../db/schema.js'
import {randomId} from '../util.js'
import {handler} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.post(
    '/link',
    bodyParser.json(),
    handler(async (req, res) => {
      let path: string
      if (typeof req.body?.path === 'string') {
        path = req.body.path
      } else {
        return res.status(400).json({
          error: 'InvalidPath',
          message: '"path" parameter is missing or not a string',
        })
      }
      if (!path.startsWith('/')) {
        return res.status(400).json({
          error: 'InvalidPath',
          message:
            '"path" parameter must be formatted as a path, starting with a "/"',
        })
      }
      const parts = getPathParts(path)
      if (parts.length === 3 && parts[0] === 'start') {
        // link pattern: /start/{did}/{rkey}
        if (!parts[1].startsWith('did:')) {
          // enforce strong links
          return res.status(400).json({
            error: 'InvalidPath',
            message:
              '"path" parameter for starter pack must contain the actor\'s DID',
          })
        }
        const id = await ensureLink(ctx, LinkType.StarterPack, parts)
        return res.json({url: getUrl(ctx, req, id)})
      }
      return res.status(400).json({
        error: 'InvalidPath',
        message: '"path" parameter does not have a known format',
      })
    }),
  )
}

const ensureLink = async (ctx: AppContext, type: LinkType, parts: string[]) => {
  const normalizedPath = normalizedPathFromParts(parts)
  const created = await ctx.db.db
    .insertInto('link')
    .values({
      id: randomId(),
      type,
      path: normalizedPath,
    })
    .onConflict(oc => oc.column('path').doNothing())
    .returningAll()
    .executeTakeFirst()
  if (created) {
    return created.id
  }
  const found = await ctx.db.db
    .selectFrom('link')
    .selectAll()
    .where('path', '=', normalizedPath)
    .executeTakeFirstOrThrow()
  return found.id
}

const getUrl = (ctx: AppContext, req: Request, id: string) => {
  if (!ctx.cfg.service.hostnames.length) {
    assert(req.headers.host, 'request must be made with host header')
    const baseUrl =
      req.protocol === 'http' && req.headers.host.startsWith('localhost:')
        ? `http://${req.headers.host}`
        : `https://${req.headers.host}`
    return `${baseUrl}/${id}`
  }
  const host = req.headers.host ?? ''
  const baseUrl = ctx.cfg.service.hostnamesSet.has(host)
    ? `https://${host}`
    : `https://${ctx.cfg.service.hostnames[0]}`
  return `${baseUrl}/${id}`
}

const normalizedPathFromParts = (parts: string[]): string => {
  // When given ['path1', 'path2', 'te:fg'], output should be
  // /path1/path2/te:fg
  return (
    '/' +
    parts
      .map(encodeURIComponent)
      .map(part => part.replace(/%3A/g, ':')) // preserve colons
      .join('/')
  )
}

const getPathParts = (path: string): string[] => {
  if (path === '/') return []
  if (path.endsWith('/')) {
    path = path.slice(0, -1) // ignore trailing slash
  }
  return path
    .slice(1) // remove leading slash
    .split('/')
    .map(decodeURIComponent)
}
