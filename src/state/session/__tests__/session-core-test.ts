import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {type SessionAccount} from '../types'

jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))

/*
 * `prefetchAgeAssuranceServerData` is a genuine prep await in each factory
 * (moderation config is synchronous, so the AA prefetch is where the factory
 * tests inject a mid-prep token rotation). The default is a no-op;
 * individual tests install behavior via `mockImplementationOnce`.
 */
const mockPrefetchAgeAssuranceServerData = jest.fn<() => void | Promise<void>>()
jest.mock('#/ageAssurance/data', () => ({
  prefetchAgeAssuranceServerData: () => mockPrefetchAgeAssuranceServerData(),
}))
/*
 * The factory tail awaits `features.refresh(...)`; stub the analytics module so
 * the factory does not pull GrowthBook (and its native deps) into this
 * lightweight suite.
 */
jest.mock('#/analytics', () => ({
  features: {refresh: () => Promise.resolve()},
}))

/*
 * `configureModerationForAccount` is now fully synchronous (the labeler cache
 * is a local MMKV read), so it is no longer a prep await - but it still runs
 * inside each factory with the freshly built bundle, before the awaited prep
 * steps. The factory tests capture the bundle with this mock, then inject a
 * real `session.refresh()` into the awaited AA prefetch so a token rotation
 * happens during prep, before arm(). The default is a no-op so other tests are
 * unaffected.
 * (jest requires out-of-scope factory references to be `mock`-prefixed.)
 */
const mockConfigureModerationForAccount =
  jest.fn<(bundle: unknown, account: unknown) => void>()
jest.mock('../moderation', () => ({
  configureModerationForAccount: (bundle: unknown, account: unknown) =>
    mockConfigureModerationForAccount(bundle, account),
  configureModerationForGuest: () => {},
}))

jest.mock('jwt-decode', () => ({
  jwtDecode(token: string) {
    if (token === 'queued-access-jwt') {
      return {scope: 'com.atproto.signupQueued'}
    }
    /*
     * A far-future exp so isSessionExpired() reads this stored token as still
     * valid, which routes resume() through the sync (no-network) fast path.
     * That isolates the prep-time refresh as the ONLY token rotation.
     */
    if (token === 'valid-access-jwt') {
      return {scope: 'com.atproto.access', exp: 4102444800}
    }
    return {scope: 'com.atproto.access'}
  },
}))

import {
  type AtpSessionEvent,
  createSessionBundleFromStoredAccount,
  disposeBundle,
  makeSessionHooks,
  registerBundleKillSwitch,
  sessionAccountToSessionData,
  type SessionBundle,
  sessionDataToSessionAccount,
} from '../session-core'

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const SERVICE = 'https://bsky.social'
const PDS_URL = 'https://shimeji.us-east.host.bsky.network'

function synthDidDoc(
  did: string,
  pdsUrl: string,
): NonNullable<SessionData['didDoc']> {
  return {
    id: did,
    service: [
      {
        id: '#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: pdsUrl,
      },
    ],
  }
}

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

  it('serializes service as a normalized URL', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData(),
      'https://bsky.social',
    )!
    expect(account.service).toBe('https://bsky.social/')
  })

  it('serializes the didDoc PDS endpoint as a normalized URL', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: synthDidDoc(DID, PDS_URL)}),
      'https://bsky.social',
    )!
    expect(account.pdsUrl).toBe(`${PDS_URL}/`)
  })

  it('leaves pdsUrl undefined for hosted accounts (no service fallback)', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: undefined}),
      'https://bsky.social',
    )!
    expect(account.pdsUrl).toBe(undefined)
  })

  it('retains the stored PDS when a valid didDoc has no PDS service', () => {
    const account = sessionDataToSessionAccount(
      makeSessionData({didDoc: {id: DID}}),
      'https://bsky.social',
      PDS_URL,
    )!
    expect(account.pdsUrl).toBe(`${PDS_URL}/`)
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

  it('preserves the exact SessionAccount field order', () => {
    /*
     * Byte-stability guard: the reducer's JSON.stringify fast path and the
     * session test snapshots depend on this exact persisted key order.
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
  })

  it('does not synthesize protocol data from a stored pdsUrl', () => {
    const data = sessionAccountToSessionData({
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    })
    expect('didDoc' in data).toBe(false)
  })

  it('round-trips account -> SessionData -> account preserving all fields', () => {
    const withPds: SessionAccount = {
      ...baseAccount,
      pdsUrl: `${PDS_URL}/`,
    }
    for (const account of [baseAccount, withPds]) {
      const data = sessionAccountToSessionData(account)
      const roundTripped = sessionDataToSessionAccount(
        data,
        account.service,
        account.pdsUrl,
      )!
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
      selfHosted.pdsUrl,
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

describe('createSessionBundleFromStoredAccount', () => {
  it('builds distinct appview and PDS clients over one session', () => {
    const result = createSessionBundleFromStoredAccount(
      makeAccount(),
      jest.fn(),
    )!

    expect(result.bundle.appviewClient).not.toBe(result.bundle.pdsClient)
    expect(result.bundle.appviewClient.service).toBe(
      'did:web:api.bsky.app#bsky_appview',
    )
    expect(result.bundle.pdsClient.service).toBeNull()
    disposeBundle(result.bundle)
  })

  it('disposes a bundle rejected by the activation guard', async () => {
    const onSessionChange = jest.fn()
    let rejectedBundle: SessionBundle | undefined
    const result = createSessionBundleFromStoredAccount(
      makeAccount(),
      onSessionChange,
      bundle => {
        rejectedBundle = bundle
        return false
      },
    )

    expect(result).toBeUndefined()
    await expect(
      rejectedBundle!.session.fetchHandler('/xrpc/test', {}),
    ).rejects.toThrow('session disposed')
    expect(onSessionChange).not.toHaveBeenCalled()
  })
})

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

  it("threads the dying session payload on the 'expired' path", () => {
    /*
     * onDeleted maps to 'expired' AND threads the dying SessionData through
     * (the library hands onDeleted the session being destroyed, before it nulls
     * its internal state). The provider reads the dying refreshJwt from this
     * payload to drive the cross-tab expiry rescue. The provider still guards
     * `refreshedAccount` on `event === 'update' && sessionData`, so the payload
     * on 'expired' does NOT produce a refreshedAccount (reducer still clears
     * tokens + logs out when no rescue applies) - see the provider test below.
     */
    const {onSessionChange, hooks} = setup()
    hooks.arm()
    void hooks.onDeleted?.call(fakeSession, fakeData)
    expect(onSessionChange.mock.calls[0][2]).toBe('expired')
    expect(onSessionChange.mock.calls[0][3]).toBe(fakeData)
  })
})

/*
 * The exact derivation from the provider's onSessionChange (index.tsx). Pinned
 * here because payload threading and this mapping together read tokens from
 * the delivered payload on 'update' and force
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
 * `PasswordSession` fires onUpdated with
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
        /* Capture the live getter to demonstrate its pre-commit state. */
        liveGetterAtHookTime = sessionDataToSessionAccount(
          session.session,
          session.session.service,
        )
        /* Derive fresh data from the delivered payload. */
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

    /* at hook time the live getter still held the previous tokens */
    expect(liveGetterAtHookTime?.accessJwt).toBe('access-jwt')
    /* the payload already contains the fresh tokens */
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
    let observedSessionData: SessionData | undefined
    const onSessionChange = jest.fn(
      (
        _bundle: SessionBundle,
        _did: string,
        event: AtpSessionEvent,
        sessionData?: SessionData,
      ) => {
        observedEvent = event
        observedSessionData = sessionData
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
    /*
     * The dying SessionData IS threaded on 'expired' (its refreshJwt drives the
     * provider's cross-tab rescue), but it does NOT become a refreshedAccount:
     * deriveRefreshedAccount only maps the 'update' path, so the reducer still
     * sees `undefined` and logs out when no rescue applies.
     */
    expect(observedSessionData?.refreshJwt).toBe('refresh-jwt')
    expect(refreshedAccountAtHookTime).toBe(undefined)
  })
})

/*
 * `PasswordSession` exposes no local
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
 * PasswordSession lifecycle over a mocked fetch, covering the resume fast path
 * and the hooks that makeSessionHooks maps into reducer events.
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
 * `useSessionApi().refreshSession()` is a thin wrapper over
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

/*
 * The resume/login factories must snapshot the returned account after
 * the prep awaits, not before. A 401 during prep triggers PasswordSession's
 * internal auto-refresh (rotating BOTH tokens and firing an onUpdated the
 * disarmed latch drops); an early snapshot would persist the stale refreshJwt,
 * which is dead on the next cold start.
 *
 * We simulate the mid-prep rotation by capturing the bundle from the mocked
 * (now synchronous) `configureModerationForAccount` and making the mocked
 * `prefetchAgeAssuranceServerData` (a genuine prep await in each factory) run
 * a real `session.refresh()`. The factory itself is re-required inside
 * `jest.isolateModulesAsync` AFTER overriding `globalThis.fetch`, because
 * the network leaf captures `globalThis.fetch` at module load - and that
 * captured fetch is what PasswordSession's auto-refresh routes through.
 */
describe('factory account snapshot after preparation', () => {
  /** Load a fresh factory graph whose network leaf captures `fetch`. */
  async function withFreshFactory(
    fetch: typeof globalThis.fetch,
    run: (core: typeof import('../session-core')) => Promise<void>,
  ) {
    const realFetch = globalThis.fetch
    globalThis.fetch = fetch
    try {
      await jest.isolateModulesAsync(async () => {
        const core =
          require('../session-core') as typeof import('../session-core')
        await run(core)
      })
    } finally {
      globalThis.fetch = realFetch
    }
  }

  beforeEach(() => {
    mockConfigureModerationForAccount.mockReset()
    mockPrefetchAgeAssuranceServerData.mockReset()
  })

  it('resume: returned account carries the tokens rotated DURING prep', async () => {
    /*
     * A refresh mid-prep rotates the session to access-jwt-2/refresh-jwt-2.
     * `valid-access-jwt` decodes as non-expired, so resume() takes the sync
     * fast path and the only refresh is the one prep triggers. The bundle is
     * captured from the (synchronous) moderation call, and the rotation is
     * injected into the awaited AA prefetch.
     */
    let capturedBundle: SessionBundle | undefined
    mockConfigureModerationForAccount.mockImplementationOnce(
      (bundle: unknown) => {
        capturedBundle = bundle as SessionBundle
      },
    )
    mockPrefetchAgeAssuranceServerData.mockImplementationOnce(async () => {
      await capturedBundle!.session.refresh()
    })
    const fetchMock = makeMockFetch()

    await withFreshFactory(asFetch(fetchMock), async core => {
      const {account, bundle} = await core.createSessionBundleAndResume(
        makeAccount({accessJwt: 'valid-access-jwt'}),
        jest.fn(),
      )
      /* the moderation prep step ran the refresh */
      expect(mockConfigureModerationForAccount).toHaveBeenCalledTimes(1)
      /* the RETURNED account carries the POST-prep (rotated) tokens */
      expect(account.accessJwt).toBe('access-jwt-2')
      expect(account.refreshJwt).toBe('refresh-jwt-2')
      /* and it matches the session's committed state */
      expect(bundle.session.session.accessJwt).toBe('access-jwt-2')
    })
  })

  it('resume: returned account falls back to the stored account when the fast path yields no live token change', async () => {
    /*
     * With no mid-prep refresh, the snapshot still reflects the valid stored
     * tokens.
     */
    mockConfigureModerationForAccount.mockReturnValueOnce(undefined)
    const fetchMock = makeMockFetch()

    await withFreshFactory(asFetch(fetchMock), async core => {
      const {account} = await core.createSessionBundleAndResume(
        makeAccount({accessJwt: 'valid-access-jwt'}),
        jest.fn(),
      )
      expect(account.accessJwt).toBe('valid-access-jwt')
      expect(account.refreshJwt).toBe('refresh-jwt')
    })
  })
})
