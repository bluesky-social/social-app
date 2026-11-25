import {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'

import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {
  RenderError,
  RenderUnavailableError,
  type RenderJob,
} from '../render/protocol.js'

export type RenderErrorContext = {
  stage: 'renderer' | 'satori' | 'resvg'
  starterPackUri: string
  title: string
  imageCount: number
  version?: string
  fonts: {name: string; weight?: number; sha256: string}[]
}

type HandlerResponse = Response<
  unknown,
  {renderErrorContext?: () => RenderErrorContext}
>

export type Handler = (req: Request, res: HandlerResponse) => Awaited<void>

/** Cancel abandoned requests while allowing normal shutdown to drain renders. */
export async function renderImage(
  ctx: AppContext,
  res: Response,
  job: RenderJob,
) {
  const controller = new AbortController()
  const onClose = () => controller.abort()
  res.once('close', onClose)
  try {
    if (res.destroyed) throw new RenderUnavailableError('Response is closed')
    return await ctx.renderer.render(job, controller.signal)
  } finally {
    res.off('close', onClose)
  }
}

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

/** Logs request failures and reports WASM traps to the process owner. */
export function errorHandler(onFatalError?: () => void): ErrorRequestHandler {
  return (err, req, res: HandlerResponse, next) => {
    const restartRequired = err instanceof WebAssembly.RuntimeError
    let render: RenderErrorContext | undefined
    let renderContextError: string | undefined
    try {
      render = res.locals.renderErrorContext?.()
      if (render && err instanceof RenderError)
        render.stage = err.stage ?? 'renderer'
    } catch (contextError) {
      renderContextError =
        contextError instanceof Error
          ? contextError.message
          : 'Unknown render diagnostics failure'
    }
    httpLogger.error(
      {err, render, renderContextError, restartRequired},
      'request error',
    )
    /* A trapped renderer can remain broken even while /_health passes. */
    if (restartRequired) onFatalError?.()
    if (res.headersSent) {
      return next(err)
    }
    if (err instanceof RenderUnavailableError) {
      return res.status(503).end('renderer unavailable')
    }
    return res.status(500).end('server error')
  }
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
