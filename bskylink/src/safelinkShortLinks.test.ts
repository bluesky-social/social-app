import assert from 'node:assert'
import {describe, it} from 'node:test'

import {LRUCache} from 'lru-cache'

import {SafelinkClient, strictestRule} from './cache/safelinkClient.js'
import {isShortLink, ShortLinkExpander} from './cache/shortLinks.js'
import {type SafelinkRule} from './db/schema.js'

/** A fetcher that answers each URL with a redirect to `redirects[url]`. */
const redirectingFetcher = (redirects: Record<string, string>) => {
  const fetched: string[] = []
  const fetcher = (url: string) => {
    fetched.push(url)
    const location = redirects[url]
    return Promise.resolve(
      location
        ? new Response(null, {status: 301, headers: {location}})
        : new Response('ok', {status: 200}),
    )
  }
  return {fetcher, fetched}
}

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

void describe('isShortLink', () => {
  void it('matches short-link services and their subdomains', () => {
    assert.ok(isShortLink(new URL('https://bit.ly/x')))
    assert.ok(isShortLink(new URL('http://www.tinyurl.com/x')))
  })

  void it('rejects lookalikes, other ports and other schemes', () => {
    assert.ok(!isShortLink(new URL('https://notbit.ly/x')))
    assert.ok(!isShortLink(new URL('https://bit.ly.evil.com/x')))
    assert.ok(!isShortLink(new URL('https://bit.ly:8443/x')))
    assert.ok(!isShortLink(new URL('https://bit.ly@evil.com/x')))
    assert.ok(!isShortLink(new URL('ftp://bit.ly/x')))
  })
})

void describe('ShortLinkExpander', () => {
  void it('leaves other links alone without fetching', async () => {
    const {fetcher, fetched} = redirectingFetcher({})
    const expander = new ShortLinkExpander(fetcher)
    assert.deepStrictEqual(await expander.expand('https://example.com/a'), [
      'https://example.com/a',
    ])
    assert.strictEqual(fetched.length, 0)
  })

  void it('follows a short link without fetching its destination', async () => {
    const {fetcher, fetched} = redirectingFetcher({
      'https://bit.ly/x': 'https://scam.com/pay',
    })
    const expander = new ShortLinkExpander(fetcher)
    assert.deepStrictEqual(await expander.expand('https://bit.ly/x'), [
      'https://bit.ly/x',
      'https://scam.com/pay',
    ])
    assert.deepStrictEqual(fetched, ['https://bit.ly/x'])
  })

  void it('follows short links that lead to other short links', async () => {
    const {fetcher} = redirectingFetcher({
      'https://bit.ly/x': 'https://tinyurl.com/y',
      'https://tinyurl.com/y': 'https://scam.com/',
    })
    const expander = new ShortLinkExpander(fetcher)
    assert.deepStrictEqual(await expander.expand('https://bit.ly/x'), [
      'https://bit.ly/x',
      'https://tinyurl.com/y',
      'https://scam.com/',
    ])
  })

  void it('resolves relative redirects', async () => {
    const {fetcher} = redirectingFetcher({'https://t.co/x': '/y'})
    const expander = new ShortLinkExpander(fetcher)
    assert.deepStrictEqual(await expander.expand('https://t.co/x'), [
      'https://t.co/x',
      'https://t.co/y',
    ])
  })

  void it('stops at loops and the hop limit', async () => {
    const loop = redirectingFetcher({
      'https://bit.ly/a': 'https://bit.ly/b',
      'https://bit.ly/b': 'https://bit.ly/a',
    })
    assert.deepStrictEqual(
      await new ShortLinkExpander(loop.fetcher).expand('https://bit.ly/a'),
      ['https://bit.ly/a', 'https://bit.ly/b'],
    )

    const redirects: Record<string, string> = {}
    for (let i = 0; i < 20; i++) {
      redirects[`https://bit.ly/${i}`] = `https://bit.ly/${i + 1}`
    }
    const long = redirectingFetcher(redirects)
    const chain = await new ShortLinkExpander(long.fetcher).expand(
      'https://bit.ly/0',
    )
    assert.strictEqual(chain.length, 6)
    assert.strictEqual(long.fetched.length, 5)
  })

  void it('ignores redirects to non-web URLs', async () => {
    const {fetcher} = redirectingFetcher({
      'https://bit.ly/x': 'javascript:alert(1)',
    })
    assert.deepStrictEqual(
      await new ShortLinkExpander(fetcher).expand('https://bit.ly/x'),
      ['https://bit.ly/x'],
    )
  })

  void it('falls back to the short link when the service fails', async () => {
    const expander = new ShortLinkExpander(() =>
      Promise.reject(new Error('timeout')),
    )
    assert.deepStrictEqual(await expander.expand('https://bit.ly/x'), [
      'https://bit.ly/x',
    ])
  })

  void it('caches expansions', async () => {
    const {fetcher, fetched} = redirectingFetcher({
      'https://bit.ly/x': 'https://example.com/',
    })
    const expander = new ShortLinkExpander(fetcher)
    await expander.expand('https://bit.ly/x')
    await expander.expand('https://bit.ly/x')
    assert.strictEqual(fetched.length, 1)
  })
})

void describe('strictestRule', () => {
  void it('prefers block over warn over anything else', () => {
    const allow = rule('domain', 'bit.ly', 'whitelist')
    const warn = rule('domain', 'iffy.com', 'warn')
    const block = rule('domain', 'scam.com', 'block')
    assert.strictEqual(strictestRule([allow, block, warn]), block)
    assert.strictEqual(strictestRule([allow, warn]), warn)
  })

  void it('keeps the first verdict when nothing is blocked or warned', () => {
    const allow = rule('domain', 'example.com', 'whitelist')
    assert.strictEqual(strictestRule([allow, 'ok']), allow)
    assert.strictEqual(strictestRule(['ok', allow]), 'ok')
  })
})

void describe('tryFindRuleForLink', () => {
  const createClient = (
    rules: SafelinkRule[],
    redirects: Record<string, string>,
  ) => {
    const client: SafelinkClient = Object.create(SafelinkClient.prototype)
    Reflect.set(client, 'domainCache', new LRUCache({max: 100}))
    Reflect.set(client, 'urlCache', new LRUCache({max: 100}))
    Reflect.set(
      client,
      'getRule',
      (_db: unknown, key: string, pattern: SafelinkRule['pattern']) => {
        const found = rules.find(r => r.pattern === pattern && r.url === key)
        return found ? Promise.resolve(found) : Promise.reject(new Error())
      },
    )
    Reflect.set(
      client,
      'shortLinks',
      new ShortLinkExpander(redirectingFetcher(redirects).fetcher),
    )
    return client
  }

  void it('blocks a short link that leads to a blocked site', async () => {
    const block = rule('domain', 'scam.com', 'block')
    const client = createClient([block], {
      'https://bit.ly/x': 'https://pay.scam.com/',
    })
    assert.strictEqual(
      await client.tryFindRuleForLink('https://bit.ly/x'),
      block,
    )
  })

  void it('allows a short link to an unblocked site', async () => {
    const client = createClient([], {
      'https://bit.ly/x': 'https://example.com/',
    })
    assert.strictEqual(
      await client.tryFindRuleForLink('https://bit.ly/x'),
      'ok',
    )
  })

  void it('checks ordinary links as before', async () => {
    const block = rule('domain', 'scam.com', 'block')
    const client = createClient([block], {})
    assert.strictEqual(
      await client.tryFindRuleForLink('https://scam.com/x'),
      block,
    )
  })

  void it('checks only the link itself when expansion is off', async () => {
    const block = rule('domain', 'scam.com', 'block')
    const client = createClient([block], {
      'https://bit.ly/x': 'https://scam.com/',
    })
    Reflect.set(client, 'shortLinks', undefined)
    assert.strictEqual(
      await client.tryFindRuleForLink('https://bit.ly/x'),
      'ok',
    )
  })
})
