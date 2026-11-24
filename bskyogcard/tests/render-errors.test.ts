import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {once} from 'node:events'
import http from 'node:http'
import {type AddressInfo} from 'node:net'
import {test} from 'node:test'

import {type AppBskyGraphDefs, AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import express from 'express'

import {envToCfg} from '../src/config.js'
import {AppContext} from '../src/context.js'
import {httpLogger} from '../src/logger.js'
import starterPackRoute from '../src/routes/starter-pack.js'
import {errorHandler, type RenderErrorContext} from '../src/routes/util.js'

function pack(rkey: string, name: string): AppBskyGraphDefs.StarterPackView {
  return {
    uri: AtUri.make(
      'fixture.test',
      'app.bsky.graph.starterpack',
      rkey,
    ).toString(),
    cid: 'unused',
    creator: {did: 'did:plc:fixture', handle: 'fixture.test'},
    record: {
      $type: 'app.bsky.graph.starterpack',
      name,
      list: AtUri.make(
        'fixture.test',
        'app.bsky.graph.list',
        'fixture',
      ).toString(),
      createdAt: '2026-11-24T00:00:00Z',
    },
    indexedAt: '2026-11-24T00:00:00Z',
  }
}

test('starter-pack failures retain render inputs without logging buffers or headers', async t => {
  const ctx = await AppContext.fromConfig(envToCfg({version: 'fixture-build'}))
  const goodFonts = ctx.fonts
  const badFont = {
    name: 'broken-font',
    weight: 700 as const,
    data: Buffer.from('invalid font'),
  }
  let releaseSlow!: () => void
  let beganSlow!: () => void
  const slowStarted = new Promise<void>(resolve => (beganSlow = resolve))
  const slowReleased = new Promise<void>(resolve => (releaseSlow = resolve))
  const packs = new Map([
    ['slow', pack('slow', 'Slow title 👩🏽‍💻')],
    ['fast', pack('fast', 'Fast title\nwith a newline')],
    [
      'success',
      pack(
        'success',
        'A long starter pack title that wraps onto a second line',
      ),
    ],
    [
      'invalid',
      {...pack('invalid', 'invalid'), record: {name: 'unvalidated title'}},
    ],
  ])
  t.mock.method(
    ctx.appviewAgent.app.bsky.graph,
    'getStarterPack',
    async ({starterPack}: {starterPack: string}) => {
      const rkey = new AtUri(starterPack).rkey
      if (rkey === 'slow') {
        beganSlow()
        await slowReleased
      }
      const fixture = packs.get(rkey)
      assert.ok(fixture)
      return {success: true, headers: {}, data: {starterPack: fixture}}
    },
  )
  const errors: {
    err: Error
    render?: RenderErrorContext
    restartRequired: boolean
  }[] = []
  t.mock.method(httpLogger, 'error', (entry: (typeof errors)[number]) => {
    errors.push(entry)
  })
  const fatal = t.mock.fn()
  const app = starterPackRoute(ctx, express())
  app.use(errorHandler(fatal))
  const server = app.listen(0, '127.0.0.1')
  t.after(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve())),
      ),
  )
  await once(server, 'listening')
  const port = (server.address() as AddressInfo).port
  const get = (rkey: string) =>
    new Promise<{status: number; body: Buffer; contentType?: string}>(
      (resolve, reject) => {
        const req = http.get(
          {
            host: '127.0.0.1',
            port,
            path: `/start/fixture.test/${rkey}`,
            agent: false,
            headers: {authorization: 'must-not-be-logged'},
          },
          res => {
            const chunks: Buffer[] = []
            res.on('data', chunk => chunks.push(chunk))
            res.on('end', () =>
              resolve({
                status: res.statusCode!,
                body: Buffer.concat(chunks),
                contentType: res.headers['content-type'],
              }),
            )
            res.on('error', reject)
          },
        )
        req.on('error', reject)
      },
    )

  ctx.fonts = [badFont]
  const slow = get('slow')
  await slowStarted
  const fast = await get('fast')
  releaseSlow()
  const slowResponse = await slow
  assert.equal(fast.status, 500)
  assert.equal(slowResponse.status, 500)
  assert.equal(fast.body.toString(), 'server error')
  assert.equal(errors.length, 2)
  for (const [index, rkey] of ['fast', 'slow'].entries()) {
    assert.ok(errors[index].err instanceof Error)
    assert.ok(errors[index].err.stack)
    assert.equal(errors[index].restartRequired, false)
    assert.deepEqual(errors[index].render, {
      stage: 'satori',
      starterPackUri: packs.get(rkey)!.uri,
      title: packs.get(rkey)!.record.name,
      imageCount: 0,
      version: 'fixture-build',
      fonts: [
        {
          name: badFont.name,
          weight: 700,
          sha256: createHash('sha256').update(badFont.data).digest('hex'),
        },
      ],
    })
    assert.ok(!JSON.stringify(errors[index].render).includes('"data"'))
    assert.ok(!JSON.stringify(errors[index]).includes('must-not-be-logged'))
  }
  assert.equal(fatal.mock.callCount(), 0)

  ctx.fonts = goodFonts
  for (const rkey of ['success', 'invalid']) {
    const response = await get(rkey)
    assert.equal(response.status, 200)
    assert.equal(response.contentType, 'image/png')
    assert.equal(response.body.readUInt32BE(16), 1200)
    assert.equal(response.body.readUInt32BE(20), 630)
  }
  assert.equal(errors.length, 2)

  const rasterError = new Error('simulated raster failure')
  t.mock.method(resvg, 'renderAsync', async () => {
    throw rasterError
  })
  assert.equal((await get('invalid')).status, 500)
  assert.equal(errors.length, 3)
  assert.equal(errors[2].err, rasterError)
  assert.equal(errors[2].render?.stage, 'resvg')
  assert.equal(errors[2].render?.title, 'Starter Pack')
  assert.deepEqual(
    errors[2].render?.fonts,
    goodFonts.map(({name, weight, data}) => ({
      name,
      weight,
      sha256: createHash('sha256').update(data).digest('hex'),
    })),
  )
  assert.equal(fatal.mock.callCount(), 0)
})
