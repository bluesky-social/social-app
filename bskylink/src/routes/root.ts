import {Express} from 'express'

import {AppContext} from '../context.js'
import {handler} from './util.js'

export default function (_ctx: AppContext, app: Express) {
  return app.get(
    '/',
    handler(async (_req, res) => {
      return res.status(301).location('https://bsky.app')
    }),
  )
}
