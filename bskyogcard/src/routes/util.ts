import {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'

import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'

export type Handler = (req: Request, res: Response) => Awaited<void>

export const handler = (runHandler: Handler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await runHandler(req, res)
    } catch (err) {
      next(err)
    }
  }
}

export function originVerifyMiddleware(ctx: AppContext): RequestHandler {
  const {originVerify} = ctx.cfg.service
  if (!originVerify) return (_req, _res, next) => next()
  return (req, res, next) => {
    const verifyHeader = req.headers['x-origin-verify']
    if (verifyHeader !== originVerify) {
      return res.status(404).end('not found')
    }
    next()
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  httpLogger.error({err}, 'request error')
  if (res.headersSent) {
    return next(err)
  }
  return res.status(500).end('server error')
}

export async function getImage(url: string) {
  const response = await fetch(ensureJpeg(url))
  const arrayBuf = await response.arrayBuffer()
  if (response.status !== 200) return null
  return Buffer.from(arrayBuf)
}

// CDN URLs end with @jpeg, @webp, or no extension (which may default to webp).
// We want to ensure the image URLs we use are for jpegs, required for compat with satori.
function ensureJpeg(url: string) {
  return url.replace(/(@[a-z]{3,5})?$/, '@jpeg')
}

export const hideAvatarLabels = new Set([
  '!hide',
  '!warn',
  'porn',
  'sexual',
  'nudity',
  'sexual-figurative',
  'graphic-media',
  'gore',
  'self-harm',
  'sensitive',
  'security',
  'impersonation',
  'scam',
  'spam',
  'misleading',
  'inauthentic',
])
