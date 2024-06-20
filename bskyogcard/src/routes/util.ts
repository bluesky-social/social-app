import {ErrorRequestHandler, Request, RequestHandler, Response} from 'express'

import {AppContext} from '../context.js'
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
