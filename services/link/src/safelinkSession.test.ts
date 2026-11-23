import assert from 'node:assert'
import {afterEach, beforeEach, describe, it} from 'node:test'

import {OzoneAgent} from './cache/safelinkClient.js'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'},
  })

const session = (accessJwt: string, refreshJwt: string) => ({
  did: 'did:plc:safelink',
  handle: 'safelink.test',
  accessJwt,
  refreshJwt,
})

void describe('OzoneAgent session', () => {
  const originalFetch = globalThis.fetch
  let calls: string[]
  let accessToken: string
  let refreshable: boolean

  beforeEach(() => {
    calls = []
    accessToken = 'access-1'
    refreshable = true
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init)
      const method = new URL(req.url).pathname.replace('/xrpc/', '')
      calls.push(method)
      const auth = req.headers.get('authorization')

      switch (method) {
        case 'com.atproto.server.createSession':
          return Promise.resolve(json(200, session(accessToken, 'refresh-1')))
        case 'com.atproto.server.refreshSession':
          if (!refreshable) {
            return Promise.resolve(
              json(400, {error: 'ExpiredToken', message: 'expired'}),
            )
          }
          accessToken = 'access-2'
          return Promise.resolve(json(200, session(accessToken, 'refresh-2')))
        case 'tools.ozone.safelink.queryEvents':
          if (auth !== `Bearer ${accessToken}`) {
            return Promise.resolve(
              json(400, {error: 'ExpiredToken', message: 'expired'}),
            )
          }
          return Promise.resolve(json(200, {events: []}))
        default:
          return Promise.resolve(json(404, {error: 'NotFound'}))
      }
    }
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const queryEvents = async (ozoneAgent: OzoneAgent) => {
    const agent = await ozoneAgent.getAgent()
    return agent.tools.ozone.safelink.queryEvents({limit: 100})
  }

  void it('logs in once and reuses the session', async () => {
    const ozoneAgent = new OzoneAgent('https://pds.test', 'safelink', 'pw')

    await queryEvents(ozoneAgent)
    await queryEvents(ozoneAgent)

    assert.deepStrictEqual(calls, [
      'com.atproto.server.createSession',
      'tools.ozone.safelink.queryEvents',
      'tools.ozone.safelink.queryEvents',
    ])
  })

  void it('refreshes an expired access token and retries', async () => {
    const ozoneAgent = new OzoneAgent('https://pds.test', 'safelink', 'pw')
    await queryEvents(ozoneAgent)

    accessToken = 'rotated'
    calls = []
    const res = await queryEvents(ozoneAgent)

    assert.deepStrictEqual(res.data.events, [])
    assert.deepStrictEqual(calls, [
      'tools.ozone.safelink.queryEvents',
      'com.atproto.server.refreshSession',
      'tools.ozone.safelink.queryEvents',
    ])
  })

  void it('logs in again once the refresh token has expired', async () => {
    const ozoneAgent = new OzoneAgent('https://pds.test', 'safelink', 'pw')
    await queryEvents(ozoneAgent)

    accessToken = 'rotated'
    refreshable = false
    await assert.rejects(queryEvents(ozoneAgent))

    calls = []
    await queryEvents(ozoneAgent)
    assert.strictEqual(calls[0], 'com.atproto.server.createSession')
  })
})
