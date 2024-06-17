import assert from 'node:assert'

import bodyParser from 'body-parser'
import {Express, Request, Response} from 'express'

import {AppContext} from '../context.js'
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
        return handleStarterPackLink(ctx, parts, req, res)
      }
      return res.status(400).json({
        error: 'InvalidPath',
        message: '"path" parameter does not have a known format',
      })
    }),
  )
}

const handleStarterPackLink = async (
  ctx: AppContext,
  parts: string[],
  req: Request,
  res: Response,
) => {
  if (!parts[1].startsWith('did:')) {
    // enforce strong links
    return res.status(400).json({
      error: 'InvalidPath',
      message: '"path" parameter for starter pack must contain the user\'s DID',
    })
  }
  const normalizedPath = normalizedPathFromParts(parts)
  const created = await ctx.db.db
    .insertInto('link')
    .values({
      id: randomId(),
      type: LinkType.StarterPack,
      path: normalizedPath,
    })
    .onConflict(oc => oc.column('path').doNothing())
    .returningAll()
    .executeTakeFirst()
  if (created) {
    return res.json({url: getUrl(ctx, req, created.id)})
  }
  const found = await ctx.db.db
    .selectFrom('link')
    .selectAll()
    .where('path', '=', normalizedPath)
    .executeTakeFirstOrThrow()
  return res.json({url: getUrl(ctx, req, found.id)})
}

const getUrl = (ctx: AppContext, req: Request, id: string) => {
  if (!ctx.cfg.service.hostnames.length) {
    assert(req.headers.host, 'request must be made with host header')
    const baseUrl =
      req.protocol === 'http'
        ? `http://${req.headers.host}`
        : `https://${req.headers.host}`
    return `${baseUrl}/${id}`
  }
  const baseUrl = ctx.cfg.service.hostnames.includes(req.headers.host)
    ? `https://${req.headers.host}`
    : `https://${ctx.cfg.service.hostnames[0]}`
  return `${baseUrl}/${id}`
}

const normalizedPathFromParts = (parts: string[]): string => {
  return '/' + parts.map(encodeURIComponent).join('/')
}

const getPathParts = (path: string): string[] => {
  if (path === '/') return []
  if (path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  return path
    .slice(1) // remove leading slash
    .split('/')
    .map(decodeURIComponent)
}
