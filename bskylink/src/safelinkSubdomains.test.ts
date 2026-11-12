import assert from 'node:assert'
import {describe, it} from 'node:test'

import {LRUCache} from 'lru-cache'

import {domainLookupOrder, SafelinkClient} from './cache/safelinkClient.js'
import {type SafelinkRule} from './db/schema.js'

const rule = (
  pattern: SafelinkRule['pattern'],
  url: string,
  action: SafelinkRule['action'],
): SafelinkRule => ({
  id: 1,
  eventType: 'addRule',
  url,
  pattern,
  action,
  createdAt: new Date().toISOString(),
})

/** A client whose database holds `rules`, recording each database lookup. */
const createClient = (rules: SafelinkRule[]) => {
  const client: SafelinkClient = Object.create(SafelinkClient.prototype)
  const lookups: string[] = []
  const domainCache = new LRUCache<string, SafelinkRule | 'ok'>({max: 100})
  Reflect.set(client, 'domainCache', domainCache)
  Reflect.set(client, 'urlCache', new LRUCache({max: 100}))
  Reflect.set(
    client,
    'getRule',
    (_db: unknown, key: string, pattern: SafelinkRule['pattern']) => {
      lookups.push(`${pattern}:${key}`)
      const found = rules.find(r => r.pattern === pattern && r.url === key)
      return found ? Promise.resolve(found) : Promise.reject(new Error('none'))
    },
  )
  return {client, lookups, domainCache}
}

void describe('domainLookupOrder', () => {
  void it('walks up to the registrable domain', () => {
    assert.deepStrictEqual(domainLookupOrder('a.pay.scam.com'), [
      'a.pay.scam.com',
      'pay.scam.com',
      'scam.com',
    ])
  })

  void it('stops at multi-part public suffixes', () => {
    assert.deepStrictEqual(domainLookupOrder('pay.scam.co.uk'), [
      'pay.scam.co.uk',
      'scam.co.uk',
    ])
  })

  void it('stops at private suffixes', () => {
    assert.deepStrictEqual(domainLookupOrder('someone.github.io'), [
      'someone.github.io',
    ])
  })

  void it('only checks the host itself for suffixes, IPs and single labels', () => {
    assert.deepStrictEqual(domainLookupOrder('co.uk'), ['co.uk'])
    assert.deepStrictEqual(domainLookupOrder('10.0.0.1'), ['10.0.0.1'])
    assert.deepStrictEqual(domainLookupOrder('localhost'), ['localhost'])
  })

  void it('keeps the port on the host, then checks domains without it', () => {
    assert.deepStrictEqual(domainLookupOrder('pay.scam.com:8443'), [
      'pay.scam.com:8443',
      'pay.scam.com',
      'scam.com',
    ])
  })
})

void describe('Safelink subdomain matching', () => {
  void it('applies a domain rule to its subdomains', async () => {
    const block = rule('domain', 'scam.com', 'block')
    const {client} = createClient([block])
    assert.strictEqual(
      await client.tryFindRule('https://pay.scam.com/login'),
      block,
    )
  })

  void it('prefers the most specific domain rule', async () => {
    const allow = rule('domain', 'safe.scam.com', 'whitelist')
    const {client} = createClient([rule('domain', 'scam.com', 'block'), allow])
    assert.strictEqual(await client.tryFindRule('https://safe.scam.com'), allow)
  })

  void it('never applies a rule on a public suffix', async () => {
    const {client} = createClient([rule('domain', 'github.io', 'block')])
    assert.strictEqual(
      await client.tryFindRule('https://someone.github.io'),
      'ok',
    )
  })

  void it('checks parents even after a subdomain was cached as clean', async () => {
    const block = rule('domain', 'scam.com', 'block')
    const rules: SafelinkRule[] = []
    const {client, domainCache} = createClient(rules)
    assert.strictEqual(await client.tryFindRule('https://pay.scam.com'), 'ok')
    // a later rule on the parent, whose cache entry the sync clears
    rules.push(block)
    domainCache.delete('scam.com')
    assert.strictEqual(await client.tryFindRule('https://pay.scam.com'), block)
  })

  void it('checks URL rules before domain rules', async () => {
    const urlBlock = rule('url', 'example.com/bad', 'block')
    const {client} = createClient([
      rule('domain', 'example.com', 'whitelist'),
      urlBlock,
    ])
    assert.strictEqual(
      await client.tryFindRule('https://example.com/bad'),
      urlBlock,
    )
  })

  void it('caches misses so repeat lookups skip the database', async () => {
    const {client, lookups} = createClient([])
    await client.tryFindRule('https://pay.scam.com')
    const first = lookups.length
    await client.tryFindRule('https://pay.scam.com')
    assert.strictEqual(lookups.length, first)
  })
})
