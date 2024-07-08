import assert from 'node:assert'
import {AddressInfo} from 'node:net'
import {after, before, describe, it} from 'node:test'

import {Database, envToCfg, LinkService, readEnv} from '../src/index.js'

describe('link service', async () => {
  let linkService: LinkService
  let baseUrl: string
  before(async () => {
    const env = readEnv()
    const cfg = envToCfg({
      ...env,
      hostnames: ['test.bsky.link'],
      appHostname: 'test.bsky.app',
      dbPostgresSchema: 'link_test',
      dbPostgresUrl: process.env.DB_POSTGRES_URL,
    })
    const migrateDb = Database.postgres({
      url: cfg.db.url,
      schema: cfg.db.schema,
    })
    await migrateDb.migrateToLatestOrThrow()
    await migrateDb.close()
    linkService = await LinkService.create(cfg)
    await linkService.start()
    const {port} = linkService.server?.address() as AddressInfo
    baseUrl = `http://localhost:${port}`
  })

  after(async () => {
    await linkService?.destroy()
  })

  it('creates a starter pack link', async () => {
    const link = await getLink('/start/did:example:alice/xxx')
    const url = new URL(link)
    assert.strictEqual(url.origin, 'https://test.bsky.link')
    assert.match(url.pathname, /^\/[a-z0-9]+$/i)
  })

  it('normalizes input paths and provides same link each time.', async () => {
    const link1 = await getLink('/start/did%3Aexample%3Abob/yyy')
    const link2 = await getLink('/start/did:example:bob/yyy/')
    assert.strictEqual(link1, link2)
  })

  it('serves permanent redirect, preserving query params.', async () => {
    const link = await getLink('/start/did:example:carol/zzz/')
    const [status, location] = await getRedirect(`${link}?a=b`)
    assert.strictEqual(status, 301)
    const locationUrl = new URL(location)
    assert.strictEqual(
      locationUrl.pathname + locationUrl.search,
      '/start/did:example:carol/zzz?a=b',
    )
  })

  it('returns json object with url when requested', async () => {
    const link = await getLink('/start/did:example:carol/zzz/')
    const [status, json] = await getJsonRedirect(link)
    assert.strictEqual(status, 200)
    assert(json.url)
    const url = new URL(json.url)
    assert.strictEqual(url.pathname, '/start/did:example:carol/zzz')
  })

  it('returns 404 for unknown link when requesting json', async () => {
    const [status, json] = await getJsonRedirect(
      'https://test.bsky.link/unknown',
    )
    assert(json.error)
    assert(json.message)
    assert.strictEqual(status, 404)
    assert.strictEqual(json.error, 'NotFound')
    assert.strictEqual(json.message, 'Link not found')
  })

  async function getRedirect(link: string): Promise<[number, string]> {
    const url = new URL(link)
    const base = new URL(baseUrl)
    url.protocol = base.protocol
    url.host = base.host
    const res = await fetch(url, {redirect: 'manual'})
    await res.arrayBuffer() // drain
    assert(
      res.status === 301 || res.status === 303,
      'response was not a redirect',
    )
    return [res.status, res.headers.get('location') ?? '']
  }

  async function getJsonRedirect(
    link: string,
  ): Promise<[number, {url?: string; error?: string; message?: string}]> {
    const url = new URL(link)
    const base = new URL(baseUrl)
    url.protocol = base.protocol
    url.host = base.host
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {accept: 'application/json,text/html'},
    })
    assert(
      res.headers.get('content-type')?.startsWith('application/json'),
      'content type was not json',
    )
    const json = await res.json()
    return [res.status, json]
  }

  async function getLink(path: string): Promise<string> {
    const res = await fetch(new URL('/link', baseUrl), {
      method: 'post',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({path}),
    })
    assert.strictEqual(res.status, 200)
    const payload = await res.json()
    assert(typeof payload.url === 'string')
    return payload.url
  }
})
