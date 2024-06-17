import assert from 'node:assert'

import React from 'react'
import {AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {Express} from 'express'
import satori from 'satori'

import {StarterPack} from '../components/StarterPack.js'
import {AppContext} from '../context.js'
import {handler} from './util.js'

const HEIGHT = 630
const WIDTH = 1200

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/start/:actor/:rkey',
    handler(async (req, res) => {
      const {actor, rkey} = req.params
      const uri = AtUri.make(actor, 'app.bsky.graph.starterpack', rkey)
      const {
        data: {starterPack},
      } = await ctx.appviewAgent.api.app.bsky.graph.getStarterPack({
        starterPack: uri.toString(),
      })
      const images = await Promise.all(
        starterPack.listItemsSample
          .filter(li => li.subject.avatar)
          .map(li => {
            assert(li.subject.avatar)
            return getImage(li.subject.avatar)
          }),
      )
      const svg = await satori(
        <StarterPack images={images} height={HEIGHT} width={WIDTH} />,
        {
          fonts: ctx.fonts,
          height: HEIGHT,
          width: WIDTH,
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
