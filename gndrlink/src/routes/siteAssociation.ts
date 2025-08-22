import { type Express } from 'express'

import { type AppContext } from '../context.js'

function getAppId(ctx: AppContext): string {
  if (ctx.cfg.service.appleTeamId && ctx.cfg.service.appleBundleId) {
    return `${ctx.cfg.service.appleTeamId}.${ctx.cfg.service.appleBundleId}`;
  }
  return ''; // or throw error if required
}

export default function (ctx: AppContext, app: Express) {
  return app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: getAppId(ctx),
            paths: ['*'],
          },
        ],
      },
      appclips: {
        apps: [
          ` ${ctx.cfg.service.appleTeamId}${ctx.cfg.service.appHostname}.AppClip`,
        ],
      },
    })
  })
}
