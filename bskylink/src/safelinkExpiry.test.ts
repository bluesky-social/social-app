import assert from 'node:assert'
import {describe, it} from 'node:test'

import {LRUCache} from 'lru-cache'

import {SafelinkClient} from './cache/safelinkClient.js'
import {type SafelinkRule} from './db/schema.js'

const rule = (
  url: string,
  expiresAt: string | null,
  action: SafelinkRule['action'] = 'block',
): SafelinkRule => ({
  id: 1,
  eventType: 'addRule',
  url,
  pattern: 'domain',
  action,
  createdAt: new Date().toISOString(),
  expiresAt,
})

/** A client whose database holds `rules`. */
const createClient = (rules: SafelinkRule[]) => {
  const client: SafelinkClient = Object.create(SafelinkClient.prototype)
  Reflect.set(client, 'domainCache', new LRUCache({max: 100}))
  Reflect.set(client, 'urlCache', new LRUCache({max: 100}))
  Reflect.set(
    client,
    'getRule',
    (_db: unknown, key: string, pattern: SafelinkRule['pattern']) => {
      const found = rules.find(r => r.pattern === pattern && r.url === key)
      return found ? Promise.resolve(found) : Promise.reject(new Error('none'))
    },
  )
  return client
}

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const anHourAgo = () => new Date(Date.now() - 60 * 60 * 1000).toISOString()

void describe('Safelink rule expiry', () => {
  void it('ignores a rule that has expired', async () => {
    const client = createClient([rule('scam.com', anHourAgo())])
    assert.strictEqual(await client.tryFindRule('https://scam.com'), 'ok')
  })

  void it('applies a rule that has not expired yet', async () => {
    const block = rule('scam.com', inAnHour())
    const client = createClient([block])
    assert.strictEqual(await client.tryFindRule('https://scam.com'), block)
  })

  void it('falls back to the parent domain when a subdomain rule expired', async () => {
    const parent = rule('scam.com', null)
    const client = createClient([rule('pay.scam.com', anHourAgo()), parent])
    assert.strictEqual(await client.tryFindRule('https://pay.scam.com'), parent)
  })

  void it('stops applying a cached rule once it expires', async () => {
    const soon = rule('scam.com', new Date(Date.now() + 50).toISOString())
    const client = createClient([soon])
    assert.strictEqual(await client.tryFindRule('https://scam.com'), soon)
    await new Promise(resolve => setTimeout(resolve, 80))
    assert.strictEqual(await client.tryFindRule('https://scam.com'), 'ok')
  })
})
