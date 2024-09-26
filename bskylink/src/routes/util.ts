import {ErrorRequestHandler, Request, RequestHandler, Response} from 'express'

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

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  httpLogger.error({err}, 'request error')
  if (res.headersSent) {
    return next(err)
  }
  return res.status(500).end('server error')
}
