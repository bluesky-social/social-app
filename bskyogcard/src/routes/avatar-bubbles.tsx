import resvg from '@resvg/resvg-js'
import {type Express} from 'express'
import satori from 'satori'

import {
  AVATAR_BUBBLES_SIZE,
  AvatarBubbles,
} from '../components/AvatarBubbles.js'
import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {
  getImage,
  handler,
  hideAvatarLabels,
  originVerifyMiddleware,
} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/avatar-bubbles',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      const didParam = req.query.did
      const dids = (Array.isArray(didParam) ? didParam : [didParam]).filter(
        (d): d is string => typeof d === 'string' && d.length > 0,
      )
      if (dids.length < 1 || dids.length > 4) {
        return res.status(400).end('did param must contain 1-4 DIDs')
      }

      let profiles
      try {
        const result = await ctx.appviewAgent.api.app.bsky.actor.getProfiles({
          actors: dids,
        })
        profiles = result.data.profiles
      } catch (err) {
        httpLogger.warn({err, dids}, 'could not fetch profiles')
        return res.status(502).end('could not fetch profiles')
      }

      const images = await Promise.all(
        dids.map(async did => {
          const profile = profiles.find(p => p.did === did)
          if (!profile?.avatar) return null
          if (profile.labels?.some(l => hideAvatarLabels.has(l.val)))
            return null
          try {
            return await getImage(profile.avatar)
          } catch (err) {
            httpLogger.warn({err, did}, 'could not fetch avatar image')
            return null
          }
        }),
      )

      const svg = await satori(<AvatarBubbles images={images} />, {
        fonts: ctx.fonts,
        height: AVATAR_BUBBLES_SIZE,
        width: AVATAR_BUBBLES_SIZE,
      })
      const output = await resvg.renderAsync(svg)
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      res.setHeader('cdn-tag', dids.join(','))
      return res.end(output.asPng())
    }),
  )
}
