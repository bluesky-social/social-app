import {ErrorRequestHandler, Request, RequestHandler, Response} from 'express'

import {httpLogger} from '../logger.js'

export type Handler = (req: Request, res: Response) => Awaited<void>

export const handler = (runHandler: Handler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await runHandler(req, res)
      next()
    } catch (err) {
      next(err)
    }
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  httpLogger.error({err}, 'request error')
  if (!res.headersSent) {
    res.status(500).end('server error')
  }
  return next()
}
