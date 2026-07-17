import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
import {describe, expect, it, jest} from '@jest/globals'

import {type SessionAccount} from '../types'

jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))

/*
 * session-core now imports the factory dependency graph (birthdate,
 * restrictChatSettings, ageAssurance, moderation). Mock the heavy leaves so the
 * pure-converter tests here stay lightweight and do not pull in the native
 * bottom-sheet module chain (same approach as session-test.ts).
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
  jwtDecode(token: string) {
    if (token === 'queued-access-jwt') {
      return {scope: 'com.atproto.signupQueued'}
    }
    return {scope: 'com.atproto.access'}
  },
}))

import {
  type AtpSessionEvent,
  disposeBundle,
  extractPdsUrl,
  makeSessionHooks,
  registerBundleKillSwitch,
  sessionAccountToSessionData,
  type SessionBundle,
  sessionDataToSessionAccount,
  synthDidDoc,
} from '../session-core'

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const SERVICE = 'https://bsky.social'
const PDS_URL = 'https://shimeji.us-east.host.bsky.network'

function makeSessionData(overrides: Partial<SessionData> = {}): SessionData {
  return {
    accessJwt: 'access-jwt',
    refreshJwt: 'refresh-jwt',
    handle: HANDLE,
    did: DID,
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    active: true,
    service: 'https://bsky.social',
    ...overrides,
  }
}

describe('extractPdsUrl', () => {
  it('extracts the PDS endpoint from a didDoc', () => {
    expect(extractPdsUrl(synthDidDoc(DID, PDS_URL))).toBe(PDS_URL)
  })

  it('matches full service ids ending in #atproto_pds', () => {
    const didDoc = {
      id: DID,
      service: [
        {
          id: `${DID}#atproto_pds`,
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: PDS_URL,
        },
      ],
    }
    expect(extractPdsUrl(didDoc)).toBe(PDS_URL)
  })

  it('returns null for missing/invalid input', () => {
    expect(extractPdsUrl(undefined)).toBe(null)
    expect(extractPdsUrl(null)).toBe(null)
    expect(extractPdsUrl({})).toBe(null)
    expect(extractPdsUrl({service: 'not-an-array'})).toBe(null)
    expect(
      extractPdsUrl({
        service: [{id: '#other_service', serviceEndpoint: PDS_URL}],
      }),
    ).toBe(null)
    expect(
      extractPdsUrl({service: [{id: '#atproto_pds', serviceEndpoint: 42}]}),
    ).toBe(null)
    expect(
      extractPdsUrl({
        service: [{id: '#atproto_pds', serviceEndpoint: 'not a url'}],
      }),
    ).toBe(null)
  })
})

describe('synthDidDoc', () => {
  it('produces a didDoc that extractPdsUrl round-trips', () => {
    const doc = synthDidDoc(DID, PDS_URL)
    expect(extractPdsUrl(doc)).toBe(PDS_URL)
    expect(doc.id).toBe(DID)
  })
})

describe('sessionDataToSessionAccount', () => {
  it('returns undefined for a missing session', () => {
    expect(sessionDataToSessionAccount(undefined, 'https://bsky.social')).toBe(
      undefined,
    )
    expect(sessionDataToSessionAccount(null, 'https://bsky.social')).toBe(
      undefined,
    )
  })

  it('maps fields for a hosted account (no didDoc)', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(account).toEqual({
      service: 'https://bsky.social/',
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
    })
  })

  it('normalizes service with a trailing slash like agent.serviceUrl.toString()', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(account.service).toBe('https://bsky.social/')
  })

  it('derives pdsUrl from the didDoc, normalized as a URL string', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: synthDidDoc(DID, PDS_URL)}),
      'https://bsky.social',
    )!
    /*
     * The old code read agent.pdsUrl?.toString() - a URL - so the persisted
     * value carries a trailing slash.
     */
    expect(account.pdsUrl).toBe(`${PDS_URL}/`)
  })

  it('leaves pdsUrl undefined for hosted accounts (no service fallback)', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: undefined}),
      'https://bsky.social',
    )!
    expect(account.pdsUrl).toBe(undefined)
  })

  it('derives isSelfHosted from the service URL', () => {
    const hosted = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(hosted.isSelfHosted).toBe(false)

    const selfHosted = sessionDataToSessionAccount(
      makeSessionData({service: 'https://pds.example.com'}),
      'https://pds.example.com',
    )!
    expect(selfHosted.isSelfHosted).toBe(true)
  })

  it('derives signupQueued from the access token scope', () => {
    const queued = sessionDataToSessionAccount(
      makeSessionData({accessJwt: 'queued-access-jwt'}),
      'https://bsky.social',
    )!
    expect(queued.signupQueued).toBe(true)

    const notQueued = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(notQueued.signupQueued).toBe(false)
  })

  it('coerces missing email flags to false', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({
        email: undefined,
        emailConfirmed: undefined,
        emailAuthFactor: undefined,
      }),
      'https://bsky.social',
    )!
    expect(account.email).toBe(undefined)
    expect(account.emailConfirmed).toBe(false)
    expect(account.emailAuthFactor).toBe(false)
  })

  it('preserves the exact field order of the old agentToSessionAccount literal', () => {
    /*
     * Byte-stability guard: the reducer's JSON.stringify fast path and the
     * session test snapshots depend on this exact key order. This is the
     * object literal order of the old agentToSessionAccount in agent.ts.
     */
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: synthDidDoc(DID, PDS_URL)}),
      'https://bsky.social',
    )!
    const golden: SessionAccount = {
      service: 'https://bsky.social/',
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
      pdsUrl: `${PDS_URL}/`,
      isSelfHosted: false,
    }
    expect(Object.keys(account)).toEqual(Object.keys(golden))
    expect(JSON.stringify(account)).toBe(JSON.stringify(golden))
  })
})

describe('sessionAccountToSessionData', () => {
  const baseAccount: SessionAccount = {
    service: 'https://bsky.social/',
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
  }

  it('maps fields with empty-string token fallbacks and active default', () => {
    const data = sessionAccountToSessionData({
      ...baseAccount,
      accessJwt: undefined,
      refreshJwt: undefined,
      active: undefined,
    })
    expect(data.accessJwt).toBe('')
    expect(data.refreshJwt).toBe('')
    expect(data.active).toBe(true)
    expect(data.did).toBe(DID)
    expect(data.handle).toBe(HANDLE)
    expect(data.service).toBe('https://bsky.social/')
  })

  it('omits didDoc when the account has no stored pdsUrl', () => {
    const data = sessionAccountToSessionData(baseAccount)
    expect('didDoc' in data).toBe(false)
    expect(extractPdsUrl(data.didDoc)).toBe(null)
  })

  it('synthesizes a didDoc from a stored pdsUrl so PDS routing works pre-refresh', () => {
    const data = sessionAccountToSessionData({
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    })
    expect(extractPdsUrl(data.didDoc)).toBe(`${PDS_URL}/`)
  })

  it('round-trips account -> SessionData -> account preserving all fields', () => {
    const withPds: SessionAccount = {
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    }
    for (const account of [baseAccount, withPds]) {
      const data = sessionAccountToSessionData(account)
      const roundTripped = sessionDataToSessionAccount(data, account.service)!
      expect(roundTripped).toEqual(account)
      expect(JSON.stringify(roundTripped)).toBe(JSON.stringify(account))
    }
  })

  it('round-trips signupQueued via the access token scope', () => {
    const queued: SessionAccount = {
      ...baseAccount,
      accessJwt: 'queued-access-jwt',
      signupQueued: true,
    }
    const roundTripped = sessionDataToSessionAccount(
      sessionAccountToSessionData(queued),
      queued.service,
    )!
    expect(roundTripped.signupQueued).toBe(true)
    expect(roundTripped).toEqual(queued)
  })

  it('round-trips a self-hosted account', () => {
    const selfHosted: SessionAccount = {
      ...baseAccount,
      service: 'https://pds.example.com/',
      pdsUrl: 'https://pds.example.com/',
      isSelfHosted: true,
    }
    const roundTripped = sessionDataToSessionAccount(
      sessionAccountToSessionData(selfHosted),
      selfHosted.service,
    )!
    expect(roundTripped).toEqual(selfHosted)
  })
})

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

/*
 * Ported from the now-deleted bridge-agent-test: the arm-latch + event mapping
 * is the durable session-hook semantics that survives the bridge removal. The
 * hook now hands the whole bundle to onSessionChange (not a bridge agent), so
 * getBundle returns a stand-in bundle whose identity is what matters.
 */
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
        (
          bundle: SessionBundle,
          did: string,
          event: AtpSessionEvent,
          sessionData?: SessionData,
        ) => void
      >()
    /* the hook only passes this through by identity; a stub bundle suffices */
    const bundle = {} as SessionBundle
    const hooks = makeSessionHooks(
      onSessionChange,
      () => bundle,
      () => DID,
    )
    return {onSessionChange, bundle, hooks}
  }

  it('swallows events before arm()', () => {
    const {onSessionChange, hooks} = setup()
    void hooks.onUpdated?.call(fakeSession, fakeData)
    expect(onSessionChange).not.toHaveBeenCalled()
  })

  it("maps onUpdated -> 'update' after arm(), passing the bundle + payload through", () => {
    const {onSessionChange, bundle, hooks} = setup()
    hooks.arm()
    void hooks.onUpdated?.call(fakeSession, fakeData)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(onSessionChange.mock.calls[0][0]).toBe(bundle)
    expect(onSessionChange.mock.calls[0][1]).toBe(DID)
    expect(onSessionChange.mock.calls[0][2]).toBe('update')
    /* the fresh SessionData the library delivers is threaded through verbatim */
    expect(onSessionChange.mock.calls[0][3]).toBe(fakeData)
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

  it("does NOT thread a payload on the 'expired' path", () => {
    /*
     * onDeleted maps to 'expired' with no sessionData. The provider guards on
     * `event === 'update' && sessionData`, so a missing payload here is what
     * forces refreshedAccount === undefined (reducer clears tokens + logs out).
     */
    const {onSessionChange, hooks} = setup()
    hooks.arm()
    void hooks.onDeleted?.call(fakeSession, fakeData)
    expect(onSessionChange.mock.calls[0][2]).toBe('expired')
    expect(onSessionChange.mock.calls[0][3]).toBe(undefined)
  })
})

/*
 * The exact derivation from the provider's onSessionChange (index.tsx). Pinned
 * here because the payload threading (session-core) and this mapping together
 * are the fix: read tokens from the delivered payload on 'update', and force
 * undefined on the drop paths so the reducer logs the user out.
 */
function deriveRefreshedAccount(
  event: AtpSessionEvent,
  sessionData?: SessionData,
): SessionAccount | undefined {
  return event === 'update' && sessionData
    ? sessionDataToSessionAccount(sessionData, sessionData.service)
    : undefined
}

/*
 * Pins the pre-commit ordering bug fix. `PasswordSession` fires onUpdated with
 * the fresh session BEFORE committing it internally, so the live getter is
 * still stale at hook time. Driven through the real library (not a hand-rolled
 * fixture) so the ordering is authentic.
 */
describe('session-hook payload threading (pre-commit ordering)', () => {
  it('delivers the NEW tokens via the payload even though the live getter is still pre-commit stale', async () => {
    const fetchMock = makeMockFetch()
    let session!: PasswordSession
    let liveGetterAtHookTime: SessionAccount | undefined
    let refreshedAccountAtHookTime: SessionAccount | undefined
    const onSessionChange = jest.fn(
      (
        _bundle: SessionBundle,
        _did: string,
        event: AtpSessionEvent,
        sessionData?: SessionData,
      ) => {
        /* what the OLD code did: snapshot the live (mutable) getter */
        liveGetterAtHookTime = sessionDataToSessionAccount(
          session.session,
          session.session.service,
        )
        /* what the fix does: derive from the delivered payload */
        refreshedAccountAtHookTime = deriveRefreshedAccount(event, sessionData)
      },
    )
    const hooks = makeSessionHooks(
      onSessionChange,
      () => ({}) as SessionBundle,
      () => DID,
    )
    session = new PasswordSession(sessionAccountToSessionData(makeAccount()), {
      ...hooks,
      fetch: asFetch(fetchMock),
    })
    hooks.arm()

    await session.refresh()

    /* pre-commit ordering: at hook time the live getter still held OLD tokens */
    expect(liveGetterAtHookTime?.accessJwt).toBe('access-jwt')
    /* the fix reads the fresh tokens from the payload the hook delivered */
    expect(refreshedAccountAtHookTime?.accessJwt).toBe('access-jwt-2')
    expect(refreshedAccountAtHookTime?.refreshJwt).toBe('refresh-jwt-2')
    /* and the session does eventually commit those same tokens */
    expect(session.session.accessJwt).toBe('access-jwt-2')
  })

  it("yields refreshedAccount === undefined on the 'expired' path (forces logout)", async () => {
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        new Response(
          JSON.stringify({error: 'ExpiredToken', message: 'Token expired'}),
          {status: 400, headers: {'content-type': 'application/json'}},
        ),
    })
    let refreshedAccountAtHookTime: SessionAccount | undefined = makeAccount()
    let observedEvent: AtpSessionEvent | undefined
    const onSessionChange = jest.fn(
      (
        _bundle: SessionBundle,
        _did: string,
        event: AtpSessionEvent,
        sessionData?: SessionData,
      ) => {
        observedEvent = event
        refreshedAccountAtHookTime = deriveRefreshedAccount(event, sessionData)
      },
    )
    const hooks = makeSessionHooks(
      onSessionChange,
      () => ({}) as SessionBundle,
      () => DID,
    )
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {...hooks, fetch: asFetch(fetchMock)},
    )
    hooks.arm()

    await expect(session.refresh()).rejects.toBeDefined()

    expect(observedEvent).toBe('expired')
    expect(refreshedAccountAtHookTime).toBe(undefined)
  })
})

/*
 * Pins the disposal kill-switch (fix 3). `PasswordSession` exposes no local
 * destroy, so disposeBundle neutralizes the session by tripping the flag inside
 * the injected fetch - after disposal every request (direct or auto-refresh,
 * which shares this same captured fetch) throws before touching the network.
 */
describe('disposeBundle kill-switch', () => {
  it('the injected fetch throws after disposeBundle', () => {
    const hooks = makeSessionHooks(
      jest.fn(),
      () => ({}) as SessionBundle,
      () => DID,
    )
    /* the injected fetch is the kill-switch wrapper makeSessionHooks bakes in */
    const injectedFetch = hooks.fetch!

    /*
     * A live session is required for disposeBundle to act (it early-returns on
     * a null/destroyed session).
     */
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {...hooks},
    )
    const bundle = {session} as unknown as SessionBundle
    registerBundleKillSwitch(bundle, hooks.kill)

    /*
     * Before disposal the wrapper does NOT throw synchronously - it delegates
     * to the async networkAwareFetch and returns a promise. Swallow that
     * promise's rejection (the real network is unavailable under jest); we only
     * care that no synchronous throw happened here.
     */
    const pending = injectedFetch('https://bsky.social/xrpc/x')
    expect(pending).toBeInstanceOf(Promise)
    void pending.catch(() => {})

    disposeBundle(bundle)

    /* after disposal every call through the injected fetch throws */
    expect(() => injectedFetch('https://bsky.social/xrpc/x')).toThrow(
      'session disposed',
    )
  })
})

/*
 * Ported from bridge-agent-test: PasswordSession lifecycle over a mocked fetch.
 * This exercises the auth core directly (the bridge that used to wrap it is
 * gone), covering the resume fast path plus the onUpdated/onDeleted/
 * onUpdateFailure hook firing that makeSessionHooks maps into reducer events.
 */
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

/*
 * refreshSession coverage (design decision (b) / Test plan). The
 * `useSessionApi().refreshSession()` callback is a thin wrapper over
 * `PasswordSession.refresh()`: on success the armed hooks dispatch exactly one
 * 'update' event and the returned snapshot reflects the refreshed data;
 * rejections propagate. We exercise the auth-core mechanics that the callback
 * relies on (a full provider render is out of scope for a unit test).
 */
describe('refreshSession semantics', () => {
  it('refresh() resolves updated data and the armed hooks dispatch exactly one update', async () => {
    const fetchMock = makeMockFetch()
    const onSessionChange =
      jest.fn<
        (bundle: SessionBundle, did: string, event: AtpSessionEvent) => void
      >()
    const bundle = {} as SessionBundle
    const hooks = makeSessionHooks(
      onSessionChange,
      () => bundle,
      () => DID,
    )
    /*
     * makeSessionHooks bakes in networkAwareFetch (the real global fetch);
     * override it with the mock while keeping the arm-latched callbacks (they
     * close over the same `armed` flag, so hooks.arm() below still applies).
     */
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {...hooks, fetch: asFetch(fetchMock)},
    )
    hooks.arm()

    await session.refresh()

    /* the refreshed tokens are live on the session */
    expect(session.session.accessJwt).toBe('access-jwt-2')
    /* exactly one 'update' event reached the reducer via the armed hooks */
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(onSessionChange.mock.calls[0][2]).toBe('update')

    /* the callback's return value is the post-refresh SessionAccount snapshot */
    const snapshot = sessionDataToSessionAccount(
      session.session,
      session.session.service,
    )!
    expect(snapshot.accessJwt).toBe('access-jwt-2')
    expect(snapshot.refreshJwt).toBe('refresh-jwt-2')
  })

  it('propagates a rejection from refresh() (invalid session)', async () => {
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        new Response(
          JSON.stringify({error: 'ExpiredToken', message: 'Token expired'}),
          {status: 400, headers: {'content-type': 'application/json'}},
        ),
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {fetch: asFetch(fetchMock)},
    )
    await expect(session.refresh()).rejects.toBeDefined()
  })
})
