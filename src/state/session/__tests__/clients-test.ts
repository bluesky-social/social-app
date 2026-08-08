import {Client} from '@atproto/lex'
import {PasswordSession} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))

jest.mock('jwt-decode', () => ({
  jwtDecode() {
    return {scope: 'com.atproto.access'}
  },
}))

import {app} from '#/lexicons'
import {BskyAppAgent, PasswordSessionManager} from '../bridge-agent'
import {agentToLexClient} from '../clients'
import {sessionAccountToSessionData} from '../session-data'
import {
  asFetch,
  DID,
  HANDLE,
  json,
  makeAccount,
  makeMockFetch,
  type MockFetch,
  SERVICE,
} from './mock-fetch'

const PROFILE_BODY = {
  did: DID,
  handle: HANDLE,
}

/** A mock fetch that answers `getProfile` and records every request. */
function makeProfileFetch(): MockFetch {
  return makeMockFetch({
    'app.bsky.actor.getProfile': () => json(PROFILE_BODY),
  })
}

/** An authenticated agent whose whole network path is the mock fetch. */
function setup(fetchMock: MockFetch = makeProfileFetch()) {
  const account = makeAccount()
  const inner = new PasswordSession(sessionAccountToSessionData(account), {
    fetch: asFetch(fetchMock),
  })
  const manager = new PasswordSessionManager(inner, {
    service: account.service,
  })
  manager.setFetch(asFetch(fetchMock))
  const agent = new BskyAppAgent(manager)
  return {agent, fetchMock}
}

/** A logged-out agent whose whole network path is the mock fetch. */
function setupPublic(fetchMock: MockFetch = makeProfileFetch()) {
  const manager = new PasswordSessionManager(null, {service: SERVICE})
  manager.setFetch(asFetch(fetchMock))
  return {agent: new BskyAppAgent(manager), fetchMock}
}

/** The `init` a mock fetch was called with for a given nsid. */
function initFor(mock: MockFetch, nsid: string): RequestInit | undefined {
  const call = mock.mock.calls.find(c => {
    const url = c[0] instanceof URL ? c[0].href : String(c[0])
    return url.includes(`/xrpc/${nsid}`)
  })
  return call?.[1]
}

describe('agentToLexClient', () => {
  let fetchMock: MockFetch

  beforeEach(() => {
    fetchMock = makeProfileFetch()
  })

  it('memoizes one client per agent', () => {
    const {agent: agentA} = setup(fetchMock)
    const {agent: agentB} = setup(fetchMock)

    const clientA1 = agentToLexClient(agentA)
    const clientA2 = agentToLexClient(agentA)
    const clientB = agentToLexClient(agentB)

    expect(clientA1).toBeInstanceOf(Client)
    expect(clientA1).toBe(clientA2)
    expect(clientA1).not.toBe(clientB)
  })

  it('passes through the agent did', () => {
    const {agent} = setup(fetchMock)
    expect(agentToLexClient(agent).did).toBe(DID)
  })

  it('reflects an undefined did on a logged-out agent', () => {
    const {agent} = setupPublic(fetchMock)
    expect(agentToLexClient(agent).did).toBeUndefined()
  })

  it('routes client.call through the agent to the network', async () => {
    const {agent} = setup(fetchMock)

    const body = await agentToLexClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    expect(body.handle).toBe(HANDLE)
    const call = fetchMock.mock.calls.find(c => {
      const url = c[0] instanceof URL ? c[0].href : String(c[0])
      return url.includes('/xrpc/app.bsky.actor.getProfile')
    })
    expect(call).toBeDefined()
    const url = call![0] instanceof URL ? call![0].href : String(call![0])
    expect(url).toContain(`actor=${HANDLE}`)
  })

  it('emits the agent proxy header', async () => {
    const {agent} = setup(fetchMock)
    agent.configureProxy('did:web:api.bsky.app#bsky_appview')

    await agentToLexClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    expect(new Headers(init?.headers).get('atproto-proxy')).toBe(
      'did:web:api.bsky.app#bsky_appview',
    )
  })

  it('emits the agent labeler header exactly once', async () => {
    const {agent} = setup(fetchMock)
    agent.configureLabelersHeader(['did:plc:labeler'])

    await agentToLexClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    const labelers = new Headers(init?.headers).get('atproto-accept-labelers')
    expect(labelers).toContain('did:plc:labeler')
    /*
     * The client contributes no labelers of its own, so the agent's single
     * entry must not be duplicated.
     */
    const entries = labelers!
      .split(',')
      .filter(l => l.includes('did:plc:labeler'))
    expect(entries).toHaveLength(1)
  })

  it('sends the session access token', async () => {
    const {agent} = setup(fetchMock)

    await agentToLexClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer access-jwt',
    )
  })

  it('falls back to unauthenticated requests once the agent is disposed', async () => {
    const {agent} = setup(fetchMock)
    const client = agentToLexClient(agent)
    agent.dispose()

    await client.call(app.bsky.actor.getProfile, {actor: HANDLE})

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    expect(new Headers(init?.headers).has('authorization')).toBe(false)
    expect(client.did).toBeUndefined()
  })
})
