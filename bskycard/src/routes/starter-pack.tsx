import assert from 'node:assert'

import React from 'react'
import {AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {Express} from 'express'
import satori from 'satori'

import {
  StarterPack,
  STARTERPACK_HEIGHT,
  STARTERPACK_WIDTH,
} from '../components/StarterPack.js'
import {AppContext} from '../context.js'
import {handler, originVerifyMiddleware} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/start/:actor/:rkey',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      const {actor, rkey} = req.params
      const uri = AtUri.make(actor, 'app.bsky.graph.starterpack', rkey)
      const {
        data: {starterPack},
      } = await ctx.appviewAgent.api.app.bsky.graph.getStarterPack({
        starterPack: uri.toString(),
      })
      const imageEntries = await Promise.all(
        starterPack.listItemsSample
          .map(li => li.subject)
          .concat(starterPack.creator)
          // has avatar
          .filter(p => p.avatar)
          // no bad labels
          .filter(p => !p.labels.some(l => hideAvatarLabels.has(l.val)))
          .map(async p => {
            assert(p.avatar)
            try {
              const image = await getImage(p.avatar)
              return [p.did, image] as const
            } catch (_err) {
              return [p.did, null] as const
            }
          }),
      )
      const images = new Map(
        imageEntries.filter(([_, image]) => image !== null),
      )
      const svg = await satori(
        <StarterPack starterPack={starterPack} images={images} />,
        {
          fonts: ctx.fonts,
          height: STARTERPACK_HEIGHT,
          width: STARTERPACK_WIDTH,
        },
      )
      const output = await resvg.renderAsync(svg)
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      return res.end(output.asPng())
    }),
  )
}

async function getImage(url: string) {
  const response = await fetch(url)
  if (response.status !== 200) return
  const arrayBuf = await response.arrayBuffer()
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
