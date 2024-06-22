import {Express} from 'express'

import {AppContext} from '../context.js'

export default function (ctx: AppContext, app: Express) {
  return app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json({
      appclips: {
        apps: ['B3LX46C5HS.xyz.blueskyweb.app.AppClip'],
      },
    })
  })
}
