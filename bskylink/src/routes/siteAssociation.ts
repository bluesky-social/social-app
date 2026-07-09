import {Express} from 'express'

import {AppContext} from '../context.js'

export default function (ctx: AppContext, app: Express) {
  return app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: 'FJ2L3R7JS4.community.blacksky.app',
            paths: ['*'],
          },
        ],
      },
      appclips: {
        apps: ['FJ2L3R7JS4.community.blacksky.app.AppClip'],
      },
    })
  })
}
