import assert from 'node:assert'
import {readFileSync} from 'node:fs'
import {IncomingMessage, ServerResponse} from 'node:http'

import React from 'react'
import {AtpAgent} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import satori from 'satori'

import {StarterPack} from '../components/StarterPack.js'

const HEIGHT = 630
const WIDTH = 1200

// GET /followers/{handle}
export async function handler(
  _req: IncomingMessage,
  res: ServerResponse,
  [_, actor]: string[],
) {
  const inter = readFileSync('./assets/Inter-Regular.ttf')
  const appview = new AtpAgent({service: 'https://api.bsky.app'})
  const {
    data: {followers},
  } = await appview.api.app.bsky.graph.getFollowers({actor})
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
      fonts: [{data: inter, name: 'Inter'}],
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
