import assert from 'node:assert'
import {IncomingMessage, ServerResponse} from 'node:http'

import React from 'react'
import resvg from '@resvg/resvg-js'
import satori from 'satori'

import {StarterPack} from '../components/StarterPack.js'
import {AppContext} from '../context.js'

const HEIGHT = 630
const WIDTH = 1200

// GET /followers/{handle}
export async function handler(
  ctx: AppContext,
  _req: IncomingMessage,
  res: ServerResponse,
  [_, actor]: string[],
) {
  const {
    data: {followers},
  } = await ctx.appviewAgent.api.app.bsky.graph.getFollowers({actor})
  const images = await Promise.all(
    followers
      .filter(p => p.avatar)
      .slice(0, 15)
      .map(p => {
        assert(p.avatar)
        return getImage(p.avatar)
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
}

async function getImage(url: string) {
  const response = await fetch(url)
  if (response.status !== 200) return
  const arrayBuf = await response.arrayBuffer()
  return Buffer.from(arrayBuf)
}
