import {beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: jest.fn(),
  getSessionId: jest.fn(),
}))

import {getDeviceId, getSessionId} from '#/analytics/identifiers'
import {app} from '#/lexicons'
import {createLexClient} from './lexClient'

const fetchHandler = jest.fn(
  (_path: `/${string}`, _init: RequestInit): Promise<Response> =>
    Promise.resolve(
      new Response(
        JSON.stringify({did: 'did:plc:alice', handle: 'alice.test'}),
        {headers: {'content-type': 'application/json'}},
      ),
    ),
)

function requestHeaders(call: number): Headers {
  return new Headers(fetchHandler.mock.calls[call][1].headers)
}

describe('createLexClient', () => {
  beforeEach(() => {
    fetchHandler.mockClear()
  })

  it('sends the current device and session identifiers on every request', async () => {
    jest.mocked(getDeviceId).mockReturnValue('device-123')
    jest.mocked(getSessionId).mockReturnValue('session-123')
    const client = createLexClient(
      {fetchHandler},
      {includeAtprotoIdentifiers: true},
    )

    await client.call(app.bsky.actor.getProfile, {actor: 'alice.test'})
    jest.mocked(getSessionId).mockReturnValue('session-456')
    await client.call(app.bsky.actor.getProfile, {actor: 'alice.test'})

    expect(requestHeaders(0).get('x-atproto-device-id')).toBe('device-123')
    expect(requestHeaders(0).get('x-atproto-session-id')).toBe('session-123')
    expect(requestHeaders(1).get('x-atproto-device-id')).toBe('device-123')
    expect(requestHeaders(1).get('x-atproto-session-id')).toBe('session-456')
  })

  it('omits identifiers unless the destination explicitly opts in', async () => {
    jest.mocked(getDeviceId).mockReturnValue('device-123')
    jest.mocked(getSessionId).mockReturnValue('session-123')
    const client = createLexClient({fetchHandler})

    await client.call(app.bsky.actor.getProfile, {actor: 'alice.test'})

    expect(requestHeaders(0).get('x-atproto-device-id')).toBeNull()
    expect(requestHeaders(0).get('x-atproto-session-id')).toBeNull()
  })

  it('omits identifiers that are not initialized', async () => {
    jest.mocked(getDeviceId).mockReturnValue(undefined)
    jest.mocked(getSessionId).mockReturnValue(undefined)
    const client = createLexClient(
      {fetchHandler},
      {includeAtprotoIdentifiers: true},
    )

    await client.call(app.bsky.actor.getProfile, {actor: 'alice.test'})

    expect(requestHeaders(0).get('x-atproto-device-id')).toBeNull()
    expect(requestHeaders(0).get('x-atproto-session-id')).toBeNull()
  })
})
