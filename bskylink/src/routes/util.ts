import {Request, RequestHandler, Response} from 'express'

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
