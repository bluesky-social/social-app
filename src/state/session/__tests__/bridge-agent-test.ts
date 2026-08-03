import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
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

import {BskyAppAgent, PasswordSessionManager} from '../bridge-agent'
import {sessionAccountToSessionData} from '../session-data'
import {type SessionAccount} from '../types'
import {
  asFetch,
  DID,
  DIDDOC_PDS_HOST,
  HANDLE,
  json,
  makeAccount,
  makeDidDoc,
  makeMockFetch,
  type MockFetch,
  PDS_HOST,
  SERVICE,
  urlsOf,
} from './mock-fetch'

/**
 * Build the manager + agent pair under test.
 *
 * The mock fetch is installed in both places it can be reached from: as the
 * inner `PasswordSession`'s fetch (the authenticated path) and, via
 * `setFetch`, as the manager's own fetch (the unauthenticated bypass path,
 * which would otherwise use the real network-aware fetch).
 */
function setup({
  account = makeAccount(),
  didDoc,
  pdsUrl,
  fetchMock = makeMockFetch(),
  sessionOptions,
}: {
  account?: SessionAccount
  didDoc?: SessionData['didDoc']
  pdsUrl?: string
  fetchMock?: MockFetch
  sessionOptions?: PasswordSessionOptions
} = {}) {
  const data: SessionData = {
    ...sessionAccountToSessionData(account),
    ...(didDoc ? {didDoc} : {}),
  }
  const inner = new PasswordSession(data, {
    fetch: asFetch(fetchMock),
    ...sessionOptions,
  })
  const manager = new PasswordSessionManager(inner, {
    service: account.service,
    pdsUrl,
  })
  manager.setFetch(asFetch(fetchMock))
  const agent = new BskyAppAgent(manager)
  return {inner, manager, agent, fetchMock}
}

function setupPublic(fetchMock: MockFetch = makeMockFetch()) {
  const manager = new PasswordSessionManager(null, {service: SERVICE})
  manager.setFetch(asFetch(fetchMock))
  return {manager, agent: new BskyAppAgent(manager), fetchMock}
}

describe('PasswordSessionManager getters', () => {
  it('reads live SessionData through .session', () => {
    const {agent} = setup()
    expect(agent.session?.did).toBe(DID)
    expect(agent.session?.handle).toBe(HANDLE)
    expect(agent.session?.email).toBe('alice@example.com')
    expect(agent.session?.emailConfirmed).toBe(true)
    expect(agent.did).toBe(DID)
    expect(agent.hasSession).toBe(true)
  })

  it('defaults active to true when the payload omits it', () => {
    const {agent} = setup({account: makeAccount({active: undefined})})
    expect(agent.session?.active).toBe(true)
  })

  it('exposes serviceUrl from the constructor service', () => {
    const {agent} = setup()
    expect(agent.serviceUrl.toString()).toBe('https://bsky.social/')
  })

  it('derives pdsUrl/dispatchUrl from the didDoc', () => {
    const {agent} = setup({didDoc: makeDidDoc(PDS_HOST)})
    expect(agent.pdsUrl?.toString()).toBe(`${PDS_HOST}/`)
    expect(agent.dispatchUrl.toString()).toBe(`${PDS_HOST}/`)
  })

  it('falls back to the stored pdsUrl when there is no didDoc', () => {
    const {agent} = setup({pdsUrl: PDS_HOST})
    expect(agent.pdsUrl?.toString()).toBe(`${PDS_HOST}/`)
    expect(agent.dispatchUrl.toString()).toBe(`${PDS_HOST}/`)
  })

  it('prefers the didDoc PDS over the stored pdsUrl', () => {
    const {agent} = setup({
      didDoc: makeDidDoc(DIDDOC_PDS_HOST),
      pdsUrl: PDS_HOST,
    })
    expect(agent.pdsUrl?.toString()).toBe(`${DIDDOC_PDS_HOST}/`)
  })

  it('dispatchUrl falls back to serviceUrl with no PDS at all', () => {
    const {agent} = setup()
    expect(agent.pdsUrl).toBe(undefined)
    expect(agent.dispatchUrl.toString()).toBe('https://bsky.social/')
  })

  it('ignores an unparseable stored pdsUrl', () => {
    const {agent} = setup({pdsUrl: 'not a url'})
    expect(agent.pdsUrl).toBe(undefined)
    expect(agent.dispatchUrl.toString()).toBe('https://bsky.social/')
  })

  it('matches the inner session on didDocs a strict validator would reject', () => {
    /*
     * No `id` on the document and a non-canonical service `type`: enough for
     * isValidDidDoc/getPdsEndpoint to bail, but PasswordSession still routes
     * here, so the bridge must agree or dispatchUrl lies about where requests
     * go (and service-auth aud gets minted for the wrong host).
     */
    const {agent} = setup({
      didDoc: {
        service: [
          {
            id: '#atproto_pds',
            type: 'SomethingElse',
            serviceEndpoint: DIDDOC_PDS_HOST,
          },
        ],
      },
      pdsUrl: PDS_HOST,
    })
    expect(agent.pdsUrl?.toString()).toBe(`${DIDDOC_PDS_HOST}/`)
    expect(agent.dispatchUrl.toString()).toBe(`${DIDDOC_PDS_HOST}/`)
  })

  it('falls back to the stored pdsUrl when the didDoc has no PDS service', () => {
    const {agent} = setup({
      didDoc: {
        id: DID,
        service: [
          {
            id: '#bsky_notif',
            type: 'BskyNotificationService',
            serviceEndpoint: DIDDOC_PDS_HOST,
          },
        ],
      },
      pdsUrl: PDS_HOST,
    })
    expect(agent.pdsUrl?.toString()).toBe(`${PDS_HOST}/`)
  })

  it('falls back to the stored pdsUrl when the PDS endpoint does not parse', () => {
    const {agent} = setup({
      didDoc: {
        id: DID,
        service: [
          {
            id: '#atproto_pds',
            type: 'AtprotoPersonalDataServer',
            serviceEndpoint: 'not a url',
          },
        ],
      },
      pdsUrl: PDS_HOST,
    })
    expect(agent.pdsUrl?.toString()).toBe(`${PDS_HOST}/`)
  })
})

describe('PasswordSessionManager.session identity', () => {
  it('is stable across consecutive reads', () => {
    const {agent} = setup()
    expect(agent.session).toBe(agent.session)
  })

  it('is a new object after a refresh rotates tokens', async () => {
    const {agent} = setup()
    const before = agent.session
    expect(before?.accessJwt).toBe('access-jwt')
    await agent.sessionManager.refreshSession()
    const after = agent.session
    expect(after).not.toBe(before)
    expect(after?.accessJwt).toBe('access-jwt-2')
    expect(after).toBe(agent.session)
  })

  it('rejects writes to .session', () => {
    const {agent} = setup()
    expect(() => {
      /* the whole point of the accessor: writes must not silently drift */
      agent.sessionManager.session = agent.session
    }).toThrow('read-only')
  })

  it('rejects writes to .pdsUrl', () => {
    const {agent} = setup()
    expect(() => {
      agent.sessionManager.pdsUrl = new URL(PDS_HOST)
    }).toThrow('read-only')
  })
})

describe('PasswordSessionManager.fetchHandler routing', () => {
  it('dispatches to the stored PDS before a refresh, then to the didDoc PDS', async () => {
    const {manager, fetchMock} = setup({pdsUrl: PDS_HOST})

    await manager.fetchHandler('/xrpc/app.bsky.actor.getProfile')
    expect(urlsOf(fetchMock).at(-1)).toBe(
      `${PDS_HOST}/xrpc/app.bsky.actor.getProfile`,
    )

    /* the refresh response carries a didDoc pointing at a different host */
    await manager.refreshSession()
    expect(manager.pdsUrl?.toString()).toBe(`${DIDDOC_PDS_HOST}/`)

    await manager.fetchHandler('/xrpc/app.bsky.actor.getProfile')
    expect(urlsOf(fetchMock).at(-1)).toBe(
      `${DIDDOC_PDS_HOST}/xrpc/app.bsky.actor.getProfile`,
    )
  })

  it('attaches the session bearer token', async () => {
    const seen: Headers[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.actor.getProfile': (_url, init) => {
        seen.push(new Headers(init.headers))
        return json({})
      },
    })
    const {manager} = setup({fetchMock})
    await manager.fetchHandler('/xrpc/app.bsky.actor.getProfile')
    expect(seen[0].get('authorization')).toBe('Bearer access-jwt')
  })

  it('bypasses the inner session when authorization is pre-set', async () => {
    const seen: Headers[] = []
    const fetchMock = makeMockFetch({
      'com.atproto.server.describeServer': (_url, init) => {
        seen.push(new Headers(init.headers))
        return json({})
      },
    })
    const {manager} = setup({fetchMock, pdsUrl: PDS_HOST})

    /*
     * PasswordSession throws TypeError on a pre-set authorization header, so
     * this path must never reach it.
     */
    await expect(
      manager.fetchHandler('/xrpc/com.atproto.server.describeServer', {
        headers: {authorization: 'Bearer caller-supplied'},
      }),
    ).resolves.toBeDefined()

    expect(seen.length).toBe(1)
    /* the caller's header survives, and there is exactly one of them */
    expect(seen[0].get('authorization')).toBe('Bearer caller-supplied')
    expect(urlsOf(fetchMock).at(-1)).toBe(
      `${PDS_HOST}/xrpc/com.atproto.server.describeServer`,
    )
  })
})

describe('BskyAppAgent namespace requests', () => {
  it('carries proxy, labeler and bearer headers to the dispatch host', async () => {
    const seen: {url: string; headers: Headers}[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.actor.getProfile': (url, init) => {
        seen.push({url, headers: new Headers(init.headers)})
        return json({did: DID, handle: HANDLE})
      },
    })
    const {agent} = setup({fetchMock, pdsUrl: PDS_HOST})
    agent.configureProxy('did:web:api.bsky.app#bsky_appview')
    agent.configureLabelers(['did:plc:custom-labeler'])

    /*
     * The request headers (what we assert) are captured by the fetch mock
     * before the agent parses the response body. Response-body lexicon
     * validation can throw in the jest environment (a multiformats CID mock
     * quirk unrelated to the header composition under test), so we ignore any
     * parse error here.
     */
    await agent.app.bsky.actor.getProfile({actor: HANDLE}).catch(() => {})

    expect(seen.length).toBe(1)
    expect(seen[0].url.startsWith(`${PDS_HOST}/xrpc/`)).toBe(true)
    expect(seen[0].headers.get('atproto-proxy')).toBe(
      'did:web:api.bsky.app#bsky_appview',
    )
    expect(seen[0].headers.get('atproto-accept-labelers')).toContain(
      'did:plc:custom-labeler',
    )
    expect(seen[0].headers.get('authorization')).toBe('Bearer access-jwt')
  })
})

describe('PasswordSessionManager.refreshSession', () => {
  it('returns an old-shaped XRPC envelope with fresh tokens', async () => {
    const {manager, fetchMock} = setup()
    const res = await manager.refreshSession()
    expect(res.success).toBe(true)
    expect(res.data.accessJwt).toBe('access-jwt-2')
    expect(res.data.refreshJwt).toBe('refresh-jwt-2')
    expect(res.data.did).toBe(DID)
    expect(res.data.handle).toBe(HANDLE)
    expect(
      urlsOf(fetchMock).some(u =>
        u.includes('com.atproto.server.refreshSession'),
      ),
    ).toBe(true)
  })

  it('throws when there is no live session', async () => {
    const {manager} = setupPublic()
    await expect(manager.refreshSession()).rejects.toThrow(
      'No session to refresh',
    )
  })
})

describe('PasswordSessionManager.resumeSession', () => {
  const staleData = {
    accessJwt: 'stale-access',
    refreshJwt: 'stale-refresh',
    handle: 'stale.test',
    did: DID,
    active: true,
  }

  it('ignores its argument and returns fresh tokens from a refresh', async () => {
    const {manager} = setup()
    const res = await manager.resumeSession(staleData)
    expect(res.data.accessJwt).toBe('access-jwt-2')
    expect(res.data.refreshJwt).toBe('refresh-jwt-2')
    expect(manager.session?.accessJwt).toBe('access-jwt-2')
  })

  it('is reachable through the agent and does not install the stale data', async () => {
    const {agent} = setup()
    await agent.resumeSession(staleData)
    expect(agent.session?.accessJwt).toBe('access-jwt-2')
    expect(agent.session?.handle).toBe(HANDLE)
  })
})

describe('PasswordSessionManager unsupported methods', () => {
  it('refuses login()', async () => {
    const {agent} = setup()
    await expect(
      agent.login({identifier: HANDLE, password: 'hunter2'}),
    ).rejects.toThrow('Not supported on PasswordSessionManager')
  })

  it('refuses createAccount()', async () => {
    const {agent} = setup()
    await expect(
      agent.createAccount({handle: HANDLE, email: 'a@b.c', password: 'x'}),
    ).rejects.toThrow('Not supported on PasswordSessionManager')
  })
})

describe('PasswordSessionManager destroyed inner session', () => {
  it('getters return undefined rather than throwing after logout', async () => {
    const {agent, inner} = setup()
    await agent.logout()
    expect(inner.destroyed).toBe(true)
    /* PasswordSession.did/.session throw once destroyed; the bridge must not */
    expect(() => agent.did).not.toThrow()
    expect(agent.did).toBe(undefined)
    expect(agent.session).toBe(undefined)
    expect(agent.hasSession).toBe(false)
    expect(agent.pdsUrl).toBe(undefined)
  })

  it('logout() is idempotent', async () => {
    const {agent} = setup()
    await agent.logout()
    await expect(agent.logout()).resolves.toBeUndefined()
  })

  it('fetchHandler stops attaching auth once destroyed', async () => {
    const seen: Headers[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.actor.getProfile': (_url, init) => {
        seen.push(new Headers(init.headers))
        return json({})
      },
    })
    const {agent, manager} = setup({fetchMock})
    await agent.logout()
    await manager.fetchHandler('/xrpc/app.bsky.actor.getProfile')
    expect(seen.length).toBe(1)
    expect(seen[0].get('authorization')).toBe(null)
  })
})

describe('BskyAppAgent.dispose', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup({pdsUrl: PDS_HOST})
  })

  it('makes the session read as logged out', () => {
    expect(ctx.agent.session).toBeDefined()
    ctx.agent.dispose()
    expect(ctx.agent.session).toBe(undefined)
    expect(ctx.agent.did).toBe(undefined)
    expect(ctx.agent.pdsUrl).toBe(undefined)
    expect(ctx.agent.hasSession).toBe(false)
  })

  it('routes requests through the plain unauthenticated fetch', async () => {
    const seen: Headers[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.actor.getProfile': (_url, init) => {
        seen.push(new Headers(init.headers))
        return json({})
      },
    })
    const {agent, manager} = setup({fetchMock, pdsUrl: PDS_HOST})
    agent.dispose()
    await manager.fetchHandler('/xrpc/app.bsky.actor.getProfile')
    expect(seen.length).toBe(1)
    expect(seen[0].get('authorization')).toBe(null)
    /* dispatch falls back to the service, since pdsUrl now reads undefined */
    expect(urlsOf(fetchMock).at(-1)).toBe(
      `${SERVICE}/xrpc/app.bsky.actor.getProfile`,
    )
  })

  it('leaves refreshSession unusable', async () => {
    ctx.agent.dispose()
    await expect(ctx.agent.sessionManager.refreshSession()).rejects.toThrow(
      'No session to refresh',
    )
  })
})

describe('public PasswordSessionManager (no inner session)', () => {
  it('reads as logged out', () => {
    const {agent} = setupPublic()
    expect(agent.session).toBe(undefined)
    expect(agent.did).toBe(undefined)
    expect(agent.hasSession).toBe(false)
    expect(agent.pdsUrl).toBe(undefined)
    expect(agent.dispatchUrl.toString()).toBe('https://bsky.social/')
  })

  it('dispatches to the service unauthenticated', async () => {
    const seen: Headers[] = []
    const fetchMock = makeMockFetch({
      'app.bsky.feed.getFeed': (_url, init) => {
        seen.push(new Headers(init.headers))
        return json({})
      },
    })
    const {manager} = setupPublic(fetchMock)
    await manager.fetchHandler('/xrpc/app.bsky.feed.getFeed')
    expect(seen.length).toBe(1)
    expect(seen[0].get('authorization')).toBe(null)
    expect(urlsOf(fetchMock).at(-1)).toBe(
      `${SERVICE}/xrpc/app.bsky.feed.getFeed`,
    )
  })
})

describe('PasswordSession lifecycle over mocked fetch', () => {
  it('resume fast path: constructing does not hit the network', () => {
    const fetchMock = makeMockFetch()
    setup({fetchMock})
    expect(fetchMock.mock.calls.length).toBe(0)
  })

  it('a refresh fires onUpdated with fresh tokens', async () => {
    const onUpdated =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdated']>>()
    const {manager} = setup({sessionOptions: {onUpdated}})
    await manager.refreshSession()
    expect(onUpdated).toHaveBeenCalledTimes(1)
    expect(manager.session?.accessJwt).toBe('access-jwt-2')
  })

  it('onDeleted fires when refresh returns a declared invalid-token error', async () => {
    const onDeleted =
      jest.fn<NonNullable<PasswordSessionOptions['onDeleted']>>()
    const onUpdated =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdated']>>()
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        json({error: 'ExpiredToken', message: 'Token expired'}, 400),
    })
    const {manager} = setup({fetchMock, sessionOptions: {onDeleted, onUpdated}})
    await expect(manager.refreshSession()).rejects.toBeDefined()
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(onUpdated).not.toHaveBeenCalled()
    /* and the bridge reads as logged out afterwards */
    expect(manager.session).toBe(undefined)
  })

  it('onUpdateFailure fires on a transient (500) refresh error, session preserved', async () => {
    const onDeleted =
      jest.fn<NonNullable<PasswordSessionOptions['onDeleted']>>()
    const onUpdateFailure =
      jest.fn<NonNullable<PasswordSessionOptions['onUpdateFailure']>>()
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        json({error: 'InternalServerError'}, 500),
    })
    const {manager} = setup({
      fetchMock,
      sessionOptions: {onDeleted, onUpdateFailure},
    })
    /*
     * PasswordSession.refresh() resolves with the unchanged data here; the
     * bridge restores the old CredentialSession contract by rejecting.
     */
    await expect(manager.refreshSession()).rejects.toThrow(
      'Failed to refresh session',
    )
    expect(onUpdateFailure).toHaveBeenCalledTimes(1)
    expect(onDeleted).not.toHaveBeenCalled()
    expect(manager.session?.accessJwt).toBe('access-jwt')
  })

  it('rejects on a network error rather than reporting a no-op success', async () => {
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () => {
        throw new TypeError('Network request failed')
      },
    })
    const {manager} = setup({fetchMock})
    await expect(manager.refreshSession()).rejects.toThrow(
      'Failed to refresh session',
    )
    /* the session survives, exactly as the old transient-failure path did */
    expect(manager.session?.accessJwt).toBe('access-jwt')
  })

  it('resumeSession rejects on a transient failure too', async () => {
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        json({error: 'InternalServerError'}, 500),
    })
    const {agent} = setup({fetchMock})
    await expect(agent.resumeSession(agent.session!)).rejects.toThrow(
      'Failed to refresh session',
    )
  })
})
