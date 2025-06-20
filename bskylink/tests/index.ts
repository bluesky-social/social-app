import assert from 'node:assert'
import {type AddressInfo} from 'node:net'
import {after, before, describe, it} from 'node:test'

import {ToolsOzoneSafelinkDefs} from '@atproto/api'

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
      safelink: 1,
      ozoneUrl: 'http://localhost:2583',
      ozoneAgentHandle: 'mod-authority.test',
      ozoneAgentPass: 'hunter2',
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

    // Ensure blocklist, whitelist, and safelink rules are set up
    const now = new Date().toISOString()
    linkService.ctx.cfg.eventCache.smartUpdate({
      $type: 'tools.ozone.safelink.defs#event',
      id: 1,
      eventType: ToolsOzoneSafelinkDefs.ADDRULE,
      url: 'https://en.wikipedia.org/wiki/Fight_Club',
      pattern: ToolsOzoneSafelinkDefs.URL,
      action: ToolsOzoneSafelinkDefs.BLOCK,
      reason: ToolsOzoneSafelinkDefs.SPAM,
      createdBy: 'did:example:admin',
      createdAt: now,
      comment: 'Do not talk about Fight Club',
    })
    linkService.ctx.cfg.eventCache.smartUpdate({
      $type: 'tools.ozone.safelink.defs#event',
      id: 2,
      eventType: ToolsOzoneSafelinkDefs.ADDRULE,
      url: 'https://gist.github.com/MattIPv4/045239bc27b16b2bcf7a3a9a4648c08a',
      pattern: ToolsOzoneSafelinkDefs.URL,
      action: ToolsOzoneSafelinkDefs.BLOCK,
      reason: ToolsOzoneSafelinkDefs.SPAM,
      createdBy: 'did:example:admin',
      createdAt: now,
      comment: 'All Bs',
    })
    linkService.ctx.cfg.eventCache.smartUpdate({
      $type: 'tools.ozone.safelink.defs#event',
      id: 3,
      eventType: ToolsOzoneSafelinkDefs.ADDRULE,
      url: 'https://en.wikipedia.org',
      pattern: ToolsOzoneSafelinkDefs.DOMAIN,
      action: ToolsOzoneSafelinkDefs.WHITELIST,
      reason: ToolsOzoneSafelinkDefs.NONE,
      createdBy: 'did:example:admin',
      createdAt: now,
      comment: 'Whitelisting the knowledge base of the internet',
    })
    linkService.ctx.cfg.eventCache.smartUpdate({
      $type: 'tools.ozone.safelink.defs#event',
      id: 4,
      eventType: ToolsOzoneSafelinkDefs.ADDRULE,
      url: 'https://www.instagram.com/teamseshbones/?hl=en',
      pattern: ToolsOzoneSafelinkDefs.URL,
      action: ToolsOzoneSafelinkDefs.BLOCK,
      reason: ToolsOzoneSafelinkDefs.SPAM,
      createdBy: 'did:example:admin',
      createdAt: now,
      comment: 'BONES has been erroneously blocked by due to an error',
    })
    // Ensure 'later' is after 'now'
    const later = new Date(Date.now() + 1000).toISOString()
    linkService.ctx.cfg.eventCache.smartUpdate({
      $type: 'tools.ozone.safelink.defs#event',
      id: 5,
      eventType: ToolsOzoneSafelinkDefs.REMOVERULE,
      url: 'https://www.instagram.com/teamseshbones/?hl=en',
      pattern: ToolsOzoneSafelinkDefs.URL,
      action: ToolsOzoneSafelinkDefs.REMOVERULE,
      reason: ToolsOzoneSafelinkDefs.NONE,
      createdBy: 'did:example:admin',
      createdAt: later,
      comment:
        'BONES has been resurrected to bring good music to the world once again',
    })

    console.log(
      linkService.ctx.cfg.eventCache.smartGet(
        'https://www.instagram.com/teamseshbones/?hl=en',
      ),
    )
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

  it(' Wikipedia whitelisted, url restricted. Redirect safely since wikipedia is whitelisted', async () => {
    const urlToRedirect = 'https://en.wikipedia.org/wiki/Fight_Club'
    const url = new URL(`${baseUrl}/redirect`)
    url.searchParams.set('u', urlToRedirect)
    const res = await fetch(url, {redirect: 'manual'})
    // The server returns an HTML meta refresh, not a real HTTP redirect
    // So status will be 200, not 301/303, and there is no Location header
    assert.strictEqual(res.status, 200)
    const html = await res.text()
    assert.match(html, /meta http-equiv="refresh"/)
    assert.match(
      html,
      new RegExp(urlToRedirect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
  })

  it('Unsafe redirect with block rule, due to the content of webpage.', async () => {
    const urlToRedirect =
      'https://gist.github.com/MattIPv4/045239bc27b16b2bcf7a3a9a4648c08a'
    const url = new URL(`${baseUrl}/redirect`)
    url.searchParams.set('u', urlToRedirect)
    const res = await fetch(url, {redirect: 'manual'})
    // The server returns an HTML meta refresh, not a real HTTP redirect
    // So status will be 200, not 301/303, and there is no Location header
    assert.strictEqual(res.status, 403)
    const html = await res.text()
    assert.match(
      html,
      new RegExp(urlToRedirect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
  })

  it('Rule adjustment, safe redirect, 200 response for Instagram Account of teamsesh Bones', async () => {
    // Retrieve the latest event after all updates
    const result = linkService.ctx.cfg.eventCache.smartGet(
      'https://www.instagram.com/teamseshbones/?hl=en',
    )
    assert(result, 'Expected event not found in eventCache')
    assert.strictEqual(result.eventType, ToolsOzoneSafelinkDefs.REMOVERULE)
    const urlToRedirect = 'https://www.instagram.com/teamseshbones/?hl=en'
    const url = new URL(`${baseUrl}/redirect`)
    url.searchParams.set('u', urlToRedirect)
    const res = await fetch(url, {redirect: 'manual'})
    // The server returns an HTML meta refresh, not a real HTTP redirect
    // So status will be 200, not 301/303, and there is no Location header
    assert.strictEqual(res.status, 200)
    const html = await res.text()
    assert.match(html, /meta http-equiv="refresh"/)
    assert.match(
      html,
      new RegExp(urlToRedirect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
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
