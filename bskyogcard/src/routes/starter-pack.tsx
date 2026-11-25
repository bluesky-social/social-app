import assert from 'node:assert'

import {type AppBskyGraphDefs, AtUri} from '@atproto/api'
import {type Express} from 'express'

import {getStarterPackTitle} from '../components/StarterPack.js'
import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {
  getImage,
  handler,
  hideAvatarLabels,
  originVerifyMiddleware,
  renderImage,
} from './util.js'
import * as bsky from '../types/bsky/index.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/start/:actor/:rkey',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      const {actor, rkey} = req.params
      const uri = AtUri.make(actor, 'app.bsky.graph.starterpack', rkey)
      let starterPack: AppBskyGraphDefs.StarterPackView
      try {
        const result = await ctx.appviewAgent.app.bsky.graph.getStarterPack({
          starterPack: uri.toString(),
        })
        starterPack = result.data.starterPack
      } catch (err) {
        httpLogger.warn(
          {err, uri: uri.toString()},
          'could not fetch starter pack',
        )
        return res.status(404).end('not found')
      }
      const imageEntries = await Promise.all(
        ([starterPack.creator] as Array<bsky.profile.AnyProfileView>)
          .concat((starterPack.listItemsSample ?? []).map(li => li.subject))
          // has avatar
          .filter(p => p.avatar)
          // no sensitive labels
          .filter(p => !p.labels?.some(l => hideAvatarLabels.has(l.val)))
          .map(async p => {
            try {
              assert(p.avatar)
              const image = await getImage(p.avatar)
              return [p.did, image] as const
            } catch (err) {
              httpLogger.warn(
                {err, uri: uri.toString(), did: p.did},
                'could not fetch image',
              )
              return [p.did, null] as const
            }
          }),
      )
      const images = new Map(
        imageEntries
          .filter(
            (entry): entry is readonly [string, Buffer<ArrayBuffer>] =>
              entry[1] !== null,
          )
          .slice(0, 7),
      )
      const title = getStarterPackTitle(starterPack)
      res.locals.renderErrorContext = () => ({
        stage: 'renderer',
        starterPackUri: uri.toString(),
        title,
        imageCount: images.size,
        version: ctx.cfg.service.version,
        fonts: ctx.fontMetadata,
      })
      const output = await renderImage(ctx, res, {
        kind: 'starter-pack',
        props: {title, creatorDid: starterPack.creator.did, images},
      })
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      res.setHeader('cdn-tag', [...images.keys()].join(','))
      return res.end(output)
    }),
  )
}
