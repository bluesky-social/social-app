import assert from 'node:assert'
import {type Server} from 'node:http'
import {type AddressInfo} from 'node:net'
import {after, before, describe, it} from 'node:test'

import express from 'express'

import {type AppContext} from './context.js'
import {type SafelinkRule} from './db/schema.js'
import i18n from './i18n.js'
import redirect from './routes/redirect.js'

const rules: Record<string, SafelinkRule['action']> = {
  'https://allowed.example.com/': 'whitelist',
  'https://blocked.example.com/': 'block',
  'https://warned.example.com/': 'warn',
}

const ctx = {
  cfg: {
    service: {
      appHostname: 'bsky.app',
      hostnames: ['go.bsky.app'],
      safelinkEnabled: true,
    },
  },
  metrics: {track: () => {}},
  safelinkClient: {
    tryFindRule: (link: string) => {
      const action = rules[link]
      return Promise.resolve(action ? {action} : 'ok')
    },
  },
} as unknown as AppContext

void describe('redirect Cache-Control', () => {
  let server: Server
  let baseUrl: string

  before(async () => {
    const app = express()
    app.use(i18n.init)
    redirect(ctx, app)
    server = app.listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  after(() => {
    server.close()
  })

  const cacheControlFor = async (link: string) => {
    const res = await fetch(
      `${baseUrl}/redirect?u=${encodeURIComponent(link)}`,
      {redirect: 'manual'},
    )
    await res.text()
    assert.ok(res.status < 500, `unexpected status ${res.status}`)
    return res.headers.get('cache-control')
  }

  void it('does not cache links without a rule', async () => {
    assert.strictEqual(
      await cacheControlFor('https://unknown.example.com/'),
      'no-store',
    )
  })

  void it('briefly caches whitelisted links', async () => {
    assert.strictEqual(
      await cacheControlFor('https://allowed.example.com/'),
      'max-age=3600',
    )
  })

  void it('does not cache blocked or warned links', async () => {
    assert.strictEqual(
      await cacheControlFor('https://blocked.example.com/'),
      'no-store',
    )
    assert.strictEqual(
      await cacheControlFor('https://warned.example.com/'),
      'no-store',
    )
  })

  void it('does not cache invalid redirects', async () => {
    assert.strictEqual(await cacheControlFor('not a url'), 'no-store')
  })
})
