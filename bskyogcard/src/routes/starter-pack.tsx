import assert from 'node:assert'

import React from 'react'
import {AppBskyGraphDefs, AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {Express} from 'express'
import satori from 'satori'

import {
  StarterPack,
  STARTERPACK_HEIGHT,
  STARTERPACK_WIDTH,
} from '../components/StarterPack.js'
import {AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {loadEmojiAsSvg} from '../util.js'
import {handler, originVerifyMiddleware} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/start/:actor/:rkey',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      const {actor, rkey} = req.params
      const uri = AtUri.make(actor, 'app.bsky.graph.starterpack', rkey)
      let starterPack: AppBskyGraphDefs.StarterPackView
      try {
        const result = await ctx.appviewAgent.api.app.bsky.graph.getStarterPack(
          {starterPack: uri.toString()},
        )
        starterPack = result.data.starterPack
      } catch (err) {
        httpLogger.warn(
          {err, uri: uri.toString()},
          'could not fetch starter pack',
        )
        return res.status(404).end('not found')
      }
      const imageEntries = await Promise.all(
        [starterPack.creator]
          .concat(starterPack.listItemsSample.map(li => li.subject))
          // has avatar
          .filter(p => p.avatar)
          // no sensitive labels
          .filter(p => !p.labels.some(l => hideAvatarLabels.has(l.val)))
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
        imageEntries.filter(([_, image]) => image !== null).slice(0, 7),
      )
      const svg = await satori(
        <StarterPack starterPack={starterPack} images={images} />,
        {
          fonts: ctx.fonts,
          height: STARTERPACK_HEIGHT,
          width: STARTERPACK_WIDTH,
          loadAdditionalAsset: async (code, text) => {
            if (code === 'emoji') {
              return await loadEmojiAsSvg(text)
            }
          },
        },
      )
      const output = await resvg.renderAsync(svg)
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      res.setHeader('cdn-tag', [...images.keys()].join(','))
      return res.end(output.asPng())
    }),
  )
}

async function getImage(url: string) {
  const response = await fetch(url)
  const arrayBuf = await response.arrayBuffer() // must drain body even if it will be discarded
  if (response.status !== 200) return null
  return Buffer.from(arrayBuf)
}

const hideAvatarLabels = new Set([
  '!hide',
  '!warn',
  'porn',
  'sexual',
  'nudity',
  'sexual-figurative',
  'graphic-media',
  'self-harm',
  'sensitive',
  'security',
  'impersonation',
  'scam',
  'spam',
  'misleading',
  'inauthentic',
])
