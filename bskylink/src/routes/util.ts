import {performance} from 'node:perf_hooks'

import {ErrorRequestHandler, Request, RequestHandler, Response} from 'express'

import {httpLogger} from '../logger.js'

const SLOW_REQUEST_THRESHOLD_MS = 1000

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

export const observedHandler = (
  operation: string,
  runHandler: Handler,
): RequestHandler => {
  return handler(async (req, res) => {
    const startedAt = performance.now()
    try {
      await runHandler(req, res)
    } finally {
      const durationMs = Math.round(performance.now() - startedAt)
      if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
        httpLogger.warn(
          {
            durationMs,
            method: req.method,
            operation,
            requestTraceId: req.get('x-amzn-trace-id'),
            statusCode: res.statusCode,
          },
          'slow request',
        )
      }
    }
  })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  httpLogger.error({err}, 'request error')
  if (res.headersSent) {
    return next(err)
  }
  return res.status(500).end('server error')
}
