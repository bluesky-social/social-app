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
 * `makeSessionHooks` reports a throwing `onSessionChange` through the logger
 * rather than letting it escape into PasswordSession's session promise. Stub
 * the module so that report is assertable (and so nothing reaches the real
 * transports).
 */
const mockLoggerError = jest.fn()
jest.mock('#/logger', () => {
  const noopLogger = {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: () => {},
    info: () => {},
    log: () => {},
    debug: () => {},
  }
  return {
    logger: noopLogger,
    Logger: {
      create: () => noopLogger,
      Context: new Proxy({}, {get: (_t, key) => String(key)}),
      Level: {},
    },
  }
})

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
 * `configureModerationForAccount` is synchronous (the labeler cache is a local
 * MMKV read), so it is not a prep await - but it still runs inside each factory
 * with the freshly built bundle, before the awaited prep steps. The factory
 * tests capture the bundle with this mock, then inject a real refresh into the
 * awaited AA prefetch so a token rotation happens during prep, before arm().
 * The default is a no-op so other tests are unaffected.
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
  buildBundle,
  createSessionBundleFromStoredAccount,
  disposeBundle,
  finishPreparation,
  makeSessionHooks,
  registerBundleKillSwitch,
  sessionAccountToSessionData,
  type SessionBundle,
  sessionDataToSessionAccount,
} from '../session-core'
import {
  asFetch,
  DID,
  HANDLE,
  makeAccount,
  makeDidDoc,
  makeMockFetch,
  PDS_HOST as PDS_URL,
  SERVICE,
} from './mock-fetch'

function synthDidDoc(
  did: string,
  pdsUrl: string,
): NonNullable<SessionData['didDoc']> {
  return makeDidDoc(pdsUrl, did)
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

describe('createSessionBundleFromStoredAccount', () => {
  it('builds three clients over one session', async () => {
    const result = createSessionBundleFromStoredAccount(
      makeAccount(),
      jest.fn(),
    )!

    /* every client reads its identity straight through the shared session */
    expect(result.bundle.session.session.accessJwt).toBe('access-jwt')
    expect(result.bundle.appviewClient.did).toBe(DID)
    expect(result.bundle.pdsClient.did).toBe(DID)
    expect(result.bundle.chatClient.did).toBe(DID)
    expect(result.bundle.service.toString()).toBe(`${SERVICE}/`)
    disposeBundle(result.bundle)
    /* disposal disables the transport every client shares */
    await expect(
      result.bundle.session.fetchHandler('/xrpc/test', {}),
    ).rejects.toThrow('session disposed')
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
    const hooks = makeSessionHooks({
      onSessionChange,
      getBundle: () => bundle,
      getDid: () => DID,
    })
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
 * `PasswordSession` fires onUpdated with the fresh session BEFORE committing it
 * internally, so the live getter is still stale at hook time.
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
    const hooks = makeSessionHooks({
      onSessionChange,
      getBundle: () => ({}) as SessionBundle,
      getDid: () => DID,
    })
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
    const hooks = makeSessionHooks({
      onSessionChange,
      getBundle: () => ({}) as SessionBundle,
      getDid: () => DID,
    })
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
    const hooks = makeSessionHooks({
      onSessionChange: jest.fn(),
      getBundle: () => ({}) as SessionBundle,
      getDid: () => DID,
    })
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
    const bundle = buildBundle(session)
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
 * A refresh through a bundle's armed hooks: the app has no `refreshSession` api
 * of its own, so every rotation the reducer sees originates here, in
 * `PasswordSession.refresh()`. On success the armed hooks dispatch exactly one
 * 'update' event and the post-refresh snapshot carries the rotated tokens;
 * rejections propagate to the caller.
 */
describe('PasswordSession.refresh through armed hooks', () => {
  it('refresh() resolves updated data and the armed hooks dispatch exactly one update', async () => {
    const fetchMock = makeMockFetch()
    const onSessionChange =
      jest.fn<
        (bundle: SessionBundle, did: string, event: AtpSessionEvent) => void
      >()
    const bundle = {} as SessionBundle
    const hooks = makeSessionHooks({
      onSessionChange,
      getBundle: () => bundle,
      getDid: () => DID,
    })
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

    /* the post-refresh SessionAccount snapshot carries the rotated tokens */
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

/**
 * Load a fresh factory graph whose network leaf captures `fetch`.
 *
 * `session-core`'s network leaf reads `globalThis.fetch` at module load, and
 * that captured fetch is what `PasswordSession`'s auto-refresh routes through,
 * so the module has to be re-required after the override is in place.
 */
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

/*
 * The resume/login factories must snapshot the returned account after
 * the prep awaits, not before. A 401 during prep triggers PasswordSession's
 * internal auto-refresh (rotating BOTH tokens and firing an onUpdated the
 * disarmed latch drops); an early snapshot would persist the stale refreshJwt,
 * which is dead on the next cold start.
 *
 * We simulate the mid-prep rotation by capturing the bundle from the mocked
 * `configureModerationForAccount` and making the mocked
 * `prefetchAgeAssuranceServerData` (a genuine prep await in each factory) run a
 * real `session.refresh()`. The factory itself is re-required inside
 * `jest.isolateModulesAsync` AFTER overriding `globalThis.fetch`, because
 * the network leaf captures `globalThis.fetch` at module load - and that
 * captured fetch is what PasswordSession's auto-refresh routes through.
 */
describe('factory account snapshot after preparation', () => {
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

/*
 * Preparation is the window between building the bundle and arming its hooks.
 * The session is live but its events are swallowed, so a session that dies in
 * here would otherwise leave the app holding a bundle that looks signed in and
 * can only make unauthenticated requests, with nothing left to log it out.
 * Both failure modes must therefore dispose the bundle and reject.
 */
describe('a session destroyed or rejected during preparation', () => {
  beforeEach(() => {
    mockConfigureModerationForAccount.mockReset()
    mockPrefetchAgeAssuranceServerData.mockReset()
  })

  it('resume: rejects with the revoked-during-prep error and disposes the bundle', async () => {
    /*
     * A revoked refresh token: the session's own refresh during prep gets a
     * declared invalid-token error, which destroys it. `logout()` is the only
     * way to drive a session to `destroyed` from outside, and it takes the same
     * `deleteSession` -> onDeleted -> destroyed path the real 401 rescue does.
     */
    let capturedBundle: SessionBundle | undefined
    mockConfigureModerationForAccount.mockImplementationOnce(
      (bundle: unknown) => {
        capturedBundle = bundle as SessionBundle
      },
    )
    mockPrefetchAgeAssuranceServerData.mockImplementationOnce(async () => {
      await capturedBundle!.session.logout()
    })
    const fetchMock = makeMockFetch()

    await withFreshFactory(asFetch(fetchMock), async core => {
      /*
       * The clean error, not PasswordSession's opaque `Logged out` getter
       * throw, which is what a naive `snapshot()` on a destroyed session would
       * surface.
       */
      await expect(
        core.createSessionBundleAndResume(
          makeAccount({accessJwt: 'valid-access-jwt'}),
          jest.fn(),
        ),
      ).rejects.toThrow('Session was revoked while it was being prepared')

      /* the bundle the caller never received reads as logged out */
      expect(capturedBundle!.session.destroyed).toBe(true)
    })
  })

  it('resume: a prep rejection propagates and disposes the bundle', async () => {
    let capturedBundle: SessionBundle | undefined
    mockConfigureModerationForAccount.mockImplementationOnce(
      (bundle: unknown) => {
        capturedBundle = bundle as SessionBundle
      },
    )
    mockPrefetchAgeAssuranceServerData.mockImplementationOnce(() =>
      Promise.reject(new Error('prefetch blew up')),
    )
    const fetchMock = makeMockFetch()

    await withFreshFactory(asFetch(fetchMock), async core => {
      await expect(
        core.createSessionBundleAndResume(
          makeAccount({accessJwt: 'valid-access-jwt'}),
          jest.fn(),
        ),
      ).rejects.toThrow('prefetch blew up')

      /* the still-live session was disposed rather than left refreshing */
      await expect(
        capturedBundle!.session.fetchHandler('/xrpc/test', {}),
      ).rejects.toThrow('session disposed')
    })
  })

  it('finishPreparation disposes and rethrows without running the snapshot', async () => {
    const hooks = makeSessionHooks({
      onSessionChange: jest.fn(),
      getBundle: () => bundle,
      getDid: () => DID,
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      /*
       * The hooks' own `fetch` is what the kill switch disables, so it must not
       * be overridden here. Nothing in this test reaches the network: the
       * post-disposal `fetchHandler` call throws before dispatching.
       */
      hooks,
    )
    const bundle = buildBundle(session)
    registerBundleKillSwitch(bundle, hooks.kill)
    const snapshot = jest.fn(() => 'never')

    await expect(
      finishPreparation(bundle, Promise.reject(new Error('nope')), snapshot),
    ).rejects.toThrow('nope')

    expect(snapshot).not.toHaveBeenCalled()
    await expect(bundle.session.fetchHandler('/xrpc/test', {})).rejects.toThrow(
      'session disposed',
    )
  })
})

/*
 * A hook must never throw: PasswordSession awaits its hooks inside the
 * assignment to its internal session promise, so an escaping throw would leave
 * that promise permanently rejected - every later request fails, while the
 * session is never marked destroyed, so disposeBundle cannot even see that the
 * bundle is dead.
 */
describe('a throwing onSessionChange does not brick the session', () => {
  beforeEach(() => {
    mockLoggerError.mockClear()
  })

  it('reports through logger.error and leaves the session usable', async () => {
    const fetchMock = makeMockFetch()
    const onSessionChange = jest.fn(() => {
      throw new Error('reducer side effect exploded')
    })
    let bundle!: SessionBundle
    const hooks = makeSessionHooks({
      onSessionChange,
      getBundle: () => bundle,
      getDid: () => DID,
    })
    const session = new PasswordSession(
      sessionAccountToSessionData(makeAccount()),
      {...hooks, fetch: asFetch(fetchMock)},
    )
    bundle = buildBundle(session)
    hooks.arm()

    await session.refresh()

    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0][1]).toEqual({
      message: "session: onSessionChange threw for a 'update' event",
    })

    /* the session still committed the rotation, and can still refresh again */
    expect(session.session.accessJwt).toBe('access-jwt-2')
    await expect(session.refresh()).resolves.toBeDefined()
    await expect(
      session.fetchHandler('/xrpc/app.bsky.actor.getProfile', {}),
    ).resolves.toBeDefined()
  })
})
