import assert from 'node:assert'
import {type AddressInfo} from 'node:net'
import {after, before, describe, it} from 'node:test'

import express from 'express'

import {type AppContext} from './context.js'
import {type SafelinkRule} from './db/schema.js'
import safelinkCheck from './routes/safelinkCheck.js'

const rule = (action: SafelinkRule['action']): SafelinkRule => ({
  id: 1,
  eventType: 'addRule',
  url: 'scam.com',
  pattern: 'domain',
  action,
  createdAt: new Date().toISOString(),
})

const listening = (server: ReturnType<express.Express['listen']>) =>
  new Promise<void>(resolve => {
    if (server.listening) resolve()
    else server.once('listening', () => resolve())
  })

/** Serves the route with a Safelink client that knows `rules` by URL. */
const serve = (rules: Record<string, SafelinkRule>, safelinkEnabled = true) => {
  const lookups: string[] = []
  const ctx = {
    cfg: {service: {safelinkEnabled}},
    safelinkClient: {
      tryFindRule: (link: string) => {
        lookups.push(link)
        return Promise.resolve(rules[new URL(link).hostname] ?? 'ok')
      },
    },
  } as unknown as AppContext
  const server = safelinkCheck(ctx, express()).listen(0)
  const check = async (u?: string) => {
    const port = (server.address() as AddressInfo).port
    const url = new URL(`http://localhost:${port}/safelink/check`)
    if (u !== undefined) url.searchParams.set('u', u)
    const res = await fetch(url)
    return {
      status: res.status,
      cache: res.headers.get('cache-control'),
      body: (await res.json()) as {action?: string; error?: string},
    }
  }
  return {server, check, lookups}
}

void describe('GET /safelink/check', () => {
  const {server, check, lookups} = serve({
    'scam.com': rule('block'),
    'sketchy.com': rule('warn'),
  })
  before(() => listening(server))
  after(() => new Promise(resolve => server.close(resolve)))

  void it('returns the matching rule action', async () => {
    assert.deepStrictEqual((await check('https://scam.com/x')).body, {
      action: 'block',
    })
    assert.deepStrictEqual((await check('https://sketchy.com')).body, {
      action: 'warn',
    })
  })

  void it('returns none when no rule matches', async () => {
    const res = await check('https://example.com')
    assert.deepStrictEqual(res.body, {action: 'none'})
    assert.strictEqual(res.cache, 'no-store')
  })

  void it('rejects missing and non-web URLs', async () => {
    const before = lookups.length
    assert.strictEqual((await check()).status, 400)
    assert.strictEqual((await check('javascript:alert(1)')).status, 400)
    assert.strictEqual((await check('not a url')).status, 400)
    assert.strictEqual(lookups.length, before)
  })
})

void describe('GET /safelink/check with Safelink off', () => {
  const {server, check, lookups} = serve({'scam.com': rule('block')}, false)
  before(() => listening(server))
  after(() => new Promise(resolve => server.close(resolve)))

  void it('returns none without a lookup', async () => {
    assert.deepStrictEqual((await check('https://scam.com')).body, {
      action: 'none',
    })
    assert.strictEqual(lookups.length, 0)
  })
})
