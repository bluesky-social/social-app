import {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'
import sharp from 'sharp'

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

// Cards render avatars at ~210px or smaller, but the CDN's full-size
// variant is up to 1000x1000. satori parses and resvg rasterizes every
// image at its intrinsic size: ~4MB of native RGBA per avatar per render,
// x7 avatars per starter-pack card. That native churn (plus satori's
// 500-entry image LRU holding the oversized data URIs) is what OOMs the
// service. Downscaling to the largest displayed size before handing the
// bytes to the render pipeline cuts decoded pixel volume ~15x with zero
// visible quality change.
const MAX_AVATAR_RENDER_PX = 256

// sharp's libvips operation cache holds decoded images in native memory
// (50MB default per process). This service re-renders unique avatars, so
// cache hits are rare and the cache is pure RSS overhead: disable it.
sharp.cache(false)

export async function getImage(url: string) {
  const response = await fetch(ensureJpeg(url))
  const arrayBuf = await response.arrayBuffer()
  if (response.status !== 200) return null
  return sharp(arrayBuf)
    .resize({
      width: MAX_AVATAR_RENDER_PX,
      height: MAX_AVATAR_RENDER_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    // quality 95: this is a second lossy encode over an already-lossy CDN
    // jpeg, and the default (80) visibly softens avatars at card sizes
    .jpeg({quality: 95})
    .toBuffer()
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
