/* eslint bsky-internal/avoid-unwrapped-text: 0 */ // --> OFF

import {once} from 'node:events'
import {readFileSync} from 'node:fs'
import {createServer} from 'node:http'

import React from 'react'
import {AtpAgent} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import satori from 'satori'

const PORT = 3000
async function main() {
  const server = createServer(async (req, res) => {
    try {
      const url = req.url
        ? new URL(req.url, 'https://domain.invalid')
        : undefined
      if (!url || url.pathname !== '/') {
        res.statusCode = 404
        res.setHeader('content-type', 'text/plain')
        return res.end('not found')
      }
      const output = await render()
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      return res.end(output.asPng())
    } catch (err) {
      console.error(err)
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('content-type', 'text/plain')
        return res.end('server error')
      }
    }
  })
  await once(server.listen(PORT), 'listening')
  console.log('listening')
  process.once('SIGINT', () => server.close())
  await once(server, 'close')
  console.log('closed')
}

async function render() {
  const inter = readFileSync('./assets/Inter-Regular.ttf')
  const appview = new AtpAgent({service: 'https://api.bsky.app'})
  const {
    data: {followers},
  } = await appview.api.app.bsky.graph.getFollowers({
    actor: 'divy.zone',
  })
  const images = await Promise.all(
    followers
      .filter(p => p.avatar)
      .slice(0, 8)
      .map(async p => {
        if (!p.avatar) return
        const res = await fetch(p.avatar)
        if (res.status !== 200) return
        const arrayBuf = await res.arrayBuffer()
        return Buffer.from(arrayBuf)
      }),
  )
  const svg = await satori(
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        width: 1200,
        height: 630,
        backgroundColor: 'black',
        color: 'white',
        fontFamily: 'Inter',
      }}>
      {[...Array(8)].map((_, i) => {
        const image = images.at(i)
        return (
          <div
            key={i}
            style={{
              flex: '1 0 25%',
              height: 315,
              display: 'flex',
            }}>
            {image && (
              <img
                src={`data:image/jpeg;base64,${image.toString('base64')}`}
                height="100%"
                width="100%"
              />
            )}
          </div>
        )
      })}
    </div>,
    {fonts: [{data: inter, name: 'Inter'}], height: 630, width: 1200},
  )
  return resvg.renderAsync(svg)
}

main()
