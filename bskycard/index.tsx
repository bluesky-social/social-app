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

const HEIGHT = 630
const WIDTH = 1200
const TILE_SIZE = HEIGHT / 3

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
      .slice(0, 15)
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
        justifyContent: 'center',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: 'black',
        color: 'white',
        fontFamily: 'Inter',
      }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          width: TILE_SIZE * 5,
          height: TILE_SIZE * 3,
        }}>
        {[...Array(15)].map((_, i) => {
          const image = images.at(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                height: TILE_SIZE,
                width: TILE_SIZE,
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
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: Math.ceil(TILE_SIZE * Math.SQRT2),
            height: Math.ceil(TILE_SIZE * Math.SQRT2),
            borderRadius: '50%',
            backgroundImage:
              'linear-gradient(to bottom right, #3D83F6, #5999FF)',
          }}>
          <Butterfly style={{color: 'white'}} width={175} />
        </div>
      </div>
    </div>,
    {fonts: [{data: inter, name: 'Inter'}], height: HEIGHT, width: WIDTH},
  )
  return resvg.renderAsync(svg)
}

function Butterfly(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 568 501"
      {...props}>
      <path
        fill="currentColor"
        d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z"
      />
    </svg>
  )
}

main()
