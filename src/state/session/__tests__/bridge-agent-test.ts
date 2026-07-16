import {type AtpSessionEvent} from '@atproto/api'
import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
import {describe, expect, it, jest} from '@jest/globals'

jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))

/*
 * session-core imports the factory dependency graph (birthdate,
 * restrictChatSettings, ageAssurance, moderation). Mock the heavy leaves so
 * these tests do not pull in the native module chain (same approach as
 * session-test.ts / session-core-test.ts).
 */
jest.mock('#/state/birthdate')
jest.mock('#/ageAssurance/data')
jest.mock('#/ageAssurance/state', () => ({
  unsafeGetAndComputeAgeAssurance: () => ({state: {}, flags: {}}),
}))
jest.mock('#/state/queries/messages/restrictChatSettings', () => ({
  restrictChatSettings: () => Promise.resolve(),
}))
jest.mock('jwt-decode', () => ({
  jwtDecode() {
    return {scope: 'com.atproto.access'}
  },
}))

import {
  makeSessionHooks,
  sessionAccountToSessionData,
  SessionAgent,
} from '../session-core'
import {type SessionAccount} from '../types'

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const SERVICE = 'https://bsky.social'
const PDS_URL = 'https://shimeji.us-east.host.bsky.network'

function makeAccount(overrides: Partial<SessionAccount> = {}): SessionAccount {
  return {
    service: SERVICE,
    did: DID,
    handle: HANDLE,
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    refreshJwt: 'refresh-jwt',
    accessJwt: 'access-jwt',
    signupQueued: false,
    active: true,
    status: undefined,
    pdsUrl: undefined,
    isSelfHosted: false,
    ...overrides,
  }
}

/**
 * Build a mock `fetch` that returns canned XRPC responses keyed by the last
 * path segment (nsid). `refreshSession` returns fresh tokens; `getSession`
 * echoes the account; anything else returns an empty 200.
 */
function makeMockFetch(
  overrides: Record<
    string,
    (url: string, init: RequestInit) => Response | Promise<Response>
  > = {},
) {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {'content-type': 'application/json'},
    })
  const fetchMock = jest.fn(
    /*
     * PasswordSession calls fetch with a URL object (new URL(path, service));
     * asFetch() below widens the mock to the full fetch signature it expects.
     */
    async (input: URL | string, init: RequestInit = {}): Promise<Response> => {
      const url = input instanceof URL ? input.href : input
      const nsid = url.split('/xrpc/')[1]?.split('?')[0]
      const handler = nsid ? overrides[nsid] : undefined
      if (handler) {
        return handler(url, init)
      }
      if (nsid === 'com.atproto.server.refreshSession') {
        return json({
          accessJwt: 'access-jwt-2',
          refreshJwt: 'refresh-jwt-2',
          handle: HANDLE,
          did: DID,
          active: true,
        })
      }
      if (nsid === 'com.atproto.server.getSession') {
        return json({
          did: DID,
          handle: HANDLE,
          email: 'alice@example.com',
          emailConfirmed: true,
          active: true,
        })
      }
      return json({})
    },
  )
  return fetchMock
}

/** Cast a jest fetch mock to the `fetch` type PasswordSession options expect. */
function asFetch(mock: ReturnType<typeof makeMockFetch>): typeof fetch {
  return mock as unknown as typeof fetch
}

describe('SessionAgent getters', () => {
  it('reads live SessionData through .session', () => {
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(makeMockFetch())},
    )
    const agent = new SessionAgent(session)
    expect(agent.session?.did).toBe(DID)
    expect(agent.session?.handle).toBe(HANDLE)
    expect(agent.did).toBe(DID)
  })

  it('derives serviceUrl from the session service', () => {
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(makeMockFetch())},
    )
    const agent = new SessionAgent(session)
    expect(agent.serviceUrl.toString()).toBe('https://bsky.social/')
  })

  it('derives pdsUrl/dispatchUrl from a synthetic didDoc', () => {
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount({pdsUrl: `${PDS_URL}/`})),
      {fetch: asFetch(makeMockFetch())},
    )
    const agent = new SessionAgent(session)
    expect(agent.pdsUrl?.toString()).toBe(`${PDS_URL}/`)
    expect(agent.dispatchUrl.toString()).toBe(`${PDS_URL}/`)
  })

  it('dispatchUrl falls back to serviceUrl when there is no PDS', () => {
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(makeMockFetch())},
    )
    const agent = new SessionAgent(session)
    expect(agent.pdsUrl).toBe(undefined)
    expect(agent.dispatchUrl.toString()).toBe('https://bsky.social/')
  })

  it('public agent exposes undefined session and public serviceUrl', () => {
    const agent = new SessionAgent(null)
    expect(agent.session).toBe(undefined)
    expect(agent.did).toBe(undefined)
    expect(agent.serviceUrl.toString()).toBe('https://public.api.bsky.app/')
  })
})

describe('SessionAgent.resumeSession', () => {
  it('calls session.refresh() and returns a success result', async () => {
    const fetchMock = makeMockFetch()
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(fetchMock)},
    )
    const agent = new SessionAgent(session)
    const res = await agent.resumeSession()
    expect(res.success).toBe(true)
    expect(res.data.accessJwt).toBe('access-jwt-2')
    /* one refreshSession call */
    const calls = fetchMock.mock.calls.map(c =>
      c[0] instanceof URL ? c[0].href : c[0],
    )
    expect(
      calls.some(u => u.includes('com.atproto.server.refreshSession')),
    ).toBe(true)
  })
})

describe('SessionAgent destroyed session', () => {
  it('did/session getters do not throw after logout', async () => {
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(makeMockFetch())},
    )
    const agent = new SessionAgent(session)
    await session.logout()
    expect(session.destroyed).toBe(true)
    /* PasswordSession.did throws when destroyed; SessionAgent must not */
    expect(() => agent.did).not.toThrow()
    expect(agent.did).toBe(undefined)
    expect(agent.session).toBe(undefined)
  })
})

describe('SessionAgent namespace routing', () => {
  it('routes a call through the session fetchHandler with proxy + labeler headers', async () => {
    const seen: {url: string; headers: Headers}[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.actor.getProfile': (url, init) => {
        seen.push({url, headers: new Headers(init.headers)})
        return new Response(JSON.stringify({did: DID, handle: HANDLE}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        })
      },
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount({pdsUrl: `${PDS_URL}/`})),
      {fetch: asFetch(fetchMock)},
    )
    const agent = new SessionAgent(session)
    /* base Agent's configureProxy is what buildBundle applies in production */
    agent.configureProxy('did:web:api.bsky.app#bsky_appview')
    agent.configureLabelers(['did:plc:custom-labeler'])

    /*
     * The request headers (what we assert) are captured by the fetch mock
     * before the base Agent parses the response body. Response-body lexicon
     * validation can throw in the jest environment (a multiformats CID mock
     * quirk unrelated to the header composition under test), so we ignore any
     * parse error here.
     */
    await agent.app.bsky.actor.getProfile({actor: HANDLE}).catch(() => {})

    expect(seen.length).toBe(1)
    expect(seen[0].headers.get('atproto-proxy')).toBe(
      'did:web:api.bsky.app#bsky_appview',
    )
    const labelers = seen[0].headers.get('atproto-accept-labelers')
    expect(labelers).toContain('did:plc:custom-labeler')
    /* the session attaches the bearer token */
    expect(seen[0].headers.get('authorization')).toBe('Bearer access-jwt')
  })
})

describe('makeSessionHooks arm-latch + event mapping', () => {
  /*
   * The hooks read neither `this` (the PasswordSession) nor their data
   * argument, so we invoke them with empty stand-ins cast to the declared
   * parameter types. This keeps the test focused on the arm-latch + event
   * mapping.
   */
  const fakeSession = {} as PasswordSession
  const fakeData = {} as SessionData

  function setup() {
    const onSessionChange =
      jest.fn<
        (agent: SessionAgent, did: string, event: AtpSessionEvent) => void
      >()
    const agent = new SessionAgent(null)
    const hooks = makeSessionHooks(
      onSessionChange,
      () => agent,
      () => DID,
    )
    return {onSessionChange, agent, hooks}
  }

  it('swallows events before arm()', () => {
    const {onSessionChange, hooks} = setup()
    void hooks.onUpdated?.call(fakeSession, fakeData)
    expect(onSessionChange).not.toHaveBeenCalled()
  })

  it("maps onUpdated -> 'update' after arm()", () => {
    const {onSessionChange, hooks} = setup()
    hooks.arm()
    void hooks.onUpdated?.call(fakeSession, fakeData)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(onSessionChange.mock.calls[0][2]).toBe('update')
  })

  it("maps onDeleted -> 'expired' after arm()", () => {
    const {onSessionChange, hooks} = setup()
    hooks.arm()
    void hooks.onDeleted?.call(fakeSession, fakeData)
    expect(onSessionChange.mock.calls[0][2]).toBe('expired')
  })

  it("maps onUpdateFailure -> 'network-error' after arm()", () => {
    const {onSessionChange, hooks} = setup()
    hooks.arm()
    void hooks.onUpdateFailure?.call(
      fakeSession,
      fakeData,
      {} as Parameters<NonNullable<typeof hooks.onUpdateFailure>>[1],
    )
    expect(onSessionChange.mock.calls[0][2]).toBe('network-error')
  })
})

describe('PasswordSession lifecycle over mocked fetch', () => {
  it('resume fast path: constructing does not hit the network', () => {
    const fetchMock = makeMockFetch()
    /* not expired -> new PasswordSession(...) with no refresh */
    void new PasswordSession(sessionAccountToSessionData(makeAccount()), {
      fetch: asFetch(fetchMock),
    })
    expect(fetchMock.mock.calls.length).toBe(0)
  })

  it('resume network path fires onUpdated with fresh tokens', async () => {
    const fetchMock = makeMockFetch()
    const onUpdated =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdated']>>()
    const session = await PasswordSession.resume(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(fetchMock), onUpdated},
    )
    expect(onUpdated).toHaveBeenCalledTimes(1)
    expect(session.session.accessJwt).toBe('access-jwt-2')
  })

  it('onDeleted fires when refresh returns a declared invalid-token error', async () => {
    const onDeleted =
      jest.fn<NonNullable<PasswordSessionOptions['onDeleted']>>()
    const onUpdated =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdated']>>()
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        new Response(
          JSON.stringify({error: 'ExpiredToken', message: 'Token expired'}),
          {status: 400, headers: {'content-type': 'application/json'}},
        ),
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(fetchMock), onDeleted, onUpdated},
    )
    await expect(session.refresh()).rejects.toBeDefined()
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(onUpdated).not.toHaveBeenCalled()
  })

  it('onUpdateFailure fires on a transient (500) refresh error, session preserved', async () => {
    const onDeleted =
      jest.fn<NonNullable<PasswordSessionOptions['onDeleted']>>()
    const onUpdateFailure =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdateFailure']>>()
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        new Response(JSON.stringify({error: 'InternalServerError'}), {
          status: 500,
          headers: {'content-type': 'application/json'},
        }),
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {
        fetch: asFetch(fetchMock),
        onDeleted,
        onUpdateFailure,
      },
    )
    await session.refresh()
    expect(onUpdateFailure).toHaveBeenCalledTimes(1)
    expect(onDeleted).not.toHaveBeenCalled()
    /* session data is preserved (still the original tokens) */
    expect(session.session.accessJwt).toBe('access-jwt')
  })
})
