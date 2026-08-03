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

import {CHAT_PROXY_SERVICE} from '#/lib/constants'
import {app, chat, com} from '#/lexicons'
import {configureGlobalAppLabelers} from '../additional-moderation-authorities'
import {BskyAppAgent, PasswordSessionManager} from '../bridge-agent'
import {
  agentToAppviewClient,
  agentToChatClient,
  agentToPdsClient,
  getUnauthenticatedThrowingClient,
  NotAuthenticatedError,
} from '../clients'
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
  urlsOf,
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

describe('agentToAppviewClient', () => {
  let fetchMock: MockFetch

  beforeEach(() => {
    fetchMock = makeProfileFetch()
  })

  it('memoizes one client per agent', () => {
    const {agent: agentA} = setup(fetchMock)
    const {agent: agentB} = setup(fetchMock)

    const clientA1 = agentToAppviewClient(agentA)
    const clientA2 = agentToAppviewClient(agentA)
    const clientB = agentToAppviewClient(agentB)

    expect(clientA1).toBeInstanceOf(Client)
    expect(clientA1).toBe(clientA2)
    expect(clientA1).not.toBe(clientB)
  })

  it('passes through the agent did', () => {
    const {agent} = setup(fetchMock)
    expect(agentToAppviewClient(agent).did).toBe(DID)
  })

  it('reflects an undefined did on a logged-out agent', () => {
    const {agent} = setupPublic(fetchMock)
    expect(agentToAppviewClient(agent).did).toBeUndefined()
  })

  it('routes client.call through the agent to the network', async () => {
    const {agent} = setup(fetchMock)

    const body = await agentToAppviewClient(agent).call(
      app.bsky.actor.getProfile,
      {
        actor: HANDLE,
      },
    )

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

    await agentToAppviewClient(agent).call(app.bsky.actor.getProfile, {
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

    await agentToAppviewClient(agent).call(app.bsky.actor.getProfile, {
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

  it('does not duplicate a global app labeler set on both statics', async () => {
    /*
     * `configureGlobalAppLabelers` populates the agent AND the lex `Client`
     * static, because clients built without a wrapped agent read only the
     * latter. On this path both producers are in play for the same request, and
     * neither dedupes against the other - the agent joins its list with the
     * existing header string while lex collects into a `Set` keyed on the
     * `;redact`-suffixed value. The appview client suppresses its `appLabelers`
     * so exactly one producer contributes.
     */
    configureGlobalAppLabelers(['did:plc:global-labeler'])
    const {agent} = setup(fetchMock)

    await agentToAppviewClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    const labelers = new Headers(init?.headers).get('atproto-accept-labelers')
    const entries = labelers!
      .split(',')
      .map(l => l.trim())
      .filter(l => l.includes('did:plc:global-labeler'))
    expect(entries).toEqual(['did:plc:global-labeler;redact'])
  })

  it('sends the session access token', async () => {
    const {agent} = setup(fetchMock)

    await agentToAppviewClient(agent).call(app.bsky.actor.getProfile, {
      actor: HANDLE,
    })

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer access-jwt',
    )
  })

  it('falls back to unauthenticated requests once the agent is disposed', async () => {
    const {agent} = setup(fetchMock)
    const client = agentToAppviewClient(agent)
    agent.dispose()

    await client.call(app.bsky.actor.getProfile, {actor: HANDLE})

    const init = initFor(fetchMock, 'app.bsky.actor.getProfile')
    expect(new Headers(init?.headers).has('authorization')).toBe(false)
    expect(client.did).toBeUndefined()
  })
})

describe('agentToPdsClient', () => {
  let fetchMock: MockFetch

  beforeEach(() => {
    fetchMock = makeProfileFetch()
  })

  it('memoizes one client per agent', () => {
    const {agent: agentA} = setup(fetchMock)
    const {agent: agentB} = setup(fetchMock)

    const clientA1 = agentToPdsClient(agentA)
    const clientA2 = agentToPdsClient(agentA)

    expect(clientA1).toBeInstanceOf(Client)
    expect(clientA1).toBe(clientA2)
    expect(clientA1).not.toBe(agentToPdsClient(agentB))
  })

  it('is a distinct client from the appview client for the same agent', () => {
    const {agent} = setup(fetchMock)
    expect(agentToPdsClient(agent)).not.toBe(agentToAppviewClient(agent))
  })

  it('passes through the agent did', () => {
    const {agent} = setup(fetchMock)
    expect(agentToPdsClient(agent).did).toBe(DID)
  })

  it('sends the session access token', async () => {
    const {agent} = setup(fetchMock)

    await agentToPdsClient(agent).call(com.atproto.server.getSession, {})

    const init = initFor(fetchMock, 'com.atproto.server.getSession')
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer access-jwt',
    )
  })

  it('emits neither the proxy nor the labeler header the agent is configured with', async () => {
    /*
     * The load-bearing difference from the appview client: this client wraps the
     * session manager, below the agent layer that sets both headers, so a
     * request reaches the account's PDS instead of being proxied onward.
     */
    const {agent} = setup(fetchMock)
    agent.configureProxy('did:web:api.bsky.app#bsky_appview')
    agent.configureLabelersHeader(['did:plc:labeler'])
    /* nor the global authorities: a PDS call is not an appview read */
    configureGlobalAppLabelers(['did:plc:global-labeler'])

    await agentToPdsClient(agent).call(com.atproto.server.getSession, {})

    const headers = new Headers(
      initFor(fetchMock, 'com.atproto.server.getSession')?.headers,
    )
    expect(headers.get('atproto-proxy')).toBeNull()
    expect(headers.get('atproto-accept-labelers')).toBeNull()
  })

  it('resolves the relative xrpc path against the account host', async () => {
    /*
     * lex-client hands its fetchHandler an origin-less `/xrpc/<nsid>` path; the
     * session manager absolutizes it against dispatchUrl.
     */
    const {agent} = setup(fetchMock)

    await agentToPdsClient(agent).call(com.atproto.server.getSession, {})

    expect(urlsOf(fetchMock)).toContain(
      `${SERVICE}/xrpc/com.atproto.server.getSession`,
    )
  })
})

describe('agentToChatClient', () => {
  let fetchMock: MockFetch

  beforeEach(() => {
    fetchMock = makeProfileFetch()
  })

  it('memoizes one client per agent, distinct from the pds client', () => {
    const {agent} = setup(fetchMock)

    const client = agentToChatClient(agent)

    expect(client).toBeInstanceOf(Client)
    expect(client).toBe(agentToChatClient(agent))
    expect(client).not.toBe(agentToPdsClient(agent))
  })

  it('emits the chat proxy header exactly once, with the session token', async () => {
    const {agent} = setup(fetchMock)

    /* the stub body fails listConvos output validation; headers are recorded pre-parse */
    await agentToChatClient(agent)
      .call(chat.bsky.convo.listConvos, {})
      .catch(() => {})

    const headers = new Headers(
      initFor(fetchMock, 'chat.bsky.convo.listConvos')?.headers,
    )
    /*
     * An exact match, not `toContain`: `Headers` comma-joins repeated entries
     * for the same name, so a second contributor would show up here.
     */
    expect(headers.get('atproto-proxy')).toBe(CHAT_PROXY_SERVICE)
    expect(headers.get('authorization')).toBe('Bearer access-jwt')
  })

  it('does not emit the agent labeler header', async () => {
    const {agent} = setup(fetchMock)
    agent.configureLabelersHeader(['did:plc:labeler'])
    /* nor the global authorities: a chat call is not an appview read */
    configureGlobalAppLabelers(['did:plc:global-labeler'])

    await agentToChatClient(agent)
      .call(chat.bsky.convo.listConvos, {})
      .catch(() => {})

    const headers = new Headers(
      initFor(fetchMock, 'chat.bsky.convo.listConvos')?.headers,
    )
    expect(headers.get('atproto-accept-labelers')).toBeNull()
  })
})

describe('getUnauthenticatedThrowingClient', () => {
  it('is a stable singleton with no did', () => {
    const client = getUnauthenticatedThrowingClient()

    expect(client.did).toBeUndefined()
    /* identity is stable so it is safe in React Query keys */
    expect(getUnauthenticatedThrowingClient()).toBe(client)
  })

  it('rejects any call with NotAuthenticatedError as the cause, with no fetch', async () => {
    /*
     * The throwing fetchHandler fires before any network I/O. lex-client wraps a
     * fetchHandler throw in an internal error whose `cause` is the original, so
     * the NotAuthenticatedError surfaces there.
     */
    const fetchMock = makeProfileFetch()
    const err = await getUnauthenticatedThrowingClient()
      .call(com.atproto.server.getSession, {})
      .then(() => undefined)
      .catch((e: unknown) => e)

    expect((err as Error).cause).toBeInstanceOf(NotAuthenticatedError)
    expect(((err as Error).cause as Error).name).toBe('NotAuthenticatedError')
    expect(((err as Error).cause as Error).message).toBe(
      'Not authenticated: this operation requires an active session',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
