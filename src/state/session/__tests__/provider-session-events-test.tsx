import {type SessionData} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

import {type Schema} from '#/state/persisted/schema'
import {type SessionAccount} from '../types'

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, which is all these tests drive. They mirror provider-abort-test.tsx,
 * plus a stateful `#/state/persisted` (this suite drives cross-tab updates and
 * the expiry rescue's fresh persisted read) and an observable
 * `emitSessionDropped`.
 */
const mockPersisted: {session: Schema['session']; latest: Schema['session']} = {
  session: {accounts: [], currentAccount: undefined},
  latest: {accounts: [], currentAccount: undefined},
}
/*
 * Every registered listener is kept, not just the newest. The provider's
 * subscription effect re-runs on every state change, so a callback captured
 * before a dispatch is exactly the stale-closure case the shouldActivate guard
 * exists to catch.
 */
const mockPersistedListeners: ((value: Schema['session']) => void)[] = []
jest.mock('#/state/persisted', () => {
  const {
    defaults,
  }: typeof import('#/state/persisted/schema') = require('#/state/persisted/schema')
  return {
    defaults,
    get: (key: string) =>
      key === 'session'
        ? mockPersisted.session
        : defaults[key as keyof typeof defaults],
    readLatest: (key: string) =>
      key === 'session'
        ? mockPersisted.latest
        : defaults[key as keyof typeof defaults],
    write: () => Promise.resolve(),
    onUpdate: (_key: string, cb: (value: Schema['session']) => void) => {
      mockPersistedListeners.push(cb)
      return () => {}
    },
  }
})
jest.mock('#/state/util', () => ({useCloseAllActiveElements: () => () => {}}))
jest.mock('#/components/dialogs/Context', () => ({
  useGlobalDialogsControlContext: () => ({signinDialogControl: {open() {}}}),
}))
jest.mock('#/analytics', () => ({
  AnalyticsContext: ({children}: {children: React.ReactNode}) => children,
  useAnalyticsBase: () => ({metric() {}, logger: {debug() {}, error() {}}}),
  utils: {accountToSessionMetadata: () => ({}), useMeta: () => undefined},
}))
jest.mock('#/state/shell/onboarding', () => ({
  useOnboardingDispatch: () => () => {},
}))
jest.mock('#/ageAssurance/data', () => ({
  clearAgeAssuranceServerDataForAll: () => {},
  clearAgeAssuranceServerDataForDid: () => {},
}))
jest.mock('#/lib/persisted-query-storage', () => ({
  clearPersistedQueryStorage: () => Promise.resolve(),
}))
jest.mock('#/lib/notifications/notifications', () => ({
  unregisterPushToken: () => Promise.resolve(),
}))
jest.mock('jwt-decode', () => ({jwtDecode: () => ({})}))

const mockEmitSessionDropped = jest.fn()
jest.mock('#/state/events', () => ({
  emitSessionDropped: () => mockEmitSessionDropped(),
  emitNetworkConfirmed: () => {},
  emitNetworkLost: () => {},
}))

/*
 * The factories are stubbed so a test controls exactly what each one returns
 * and when. `createSessionBundleFromStoredAccount` is stubbed faithfully rather
 * than replaced by a constant: it must still consult `shouldActivate` and
 * decline to hand back a bundle when the guard rejects, because that decision
 * is what these tests observe. Its disposal of a rejected bundle is pinned by
 * session-core-test; here we only assert what the provider does with the
 * result.
 */
const mockLogin = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockResume = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockDisposeBundle = jest.fn()
type Rebuild = {
  account: SessionAccount
  shouldActivate: boolean
  bundle: FakeBundle
}
const mockRebuilds: Rebuild[] = []
const mockRebuild = jest.fn(
  (
    account: SessionAccount,
    _onSessionChange: unknown,
    shouldActivate: (
      bundle: unknown,
      account: SessionAccount,
    ) => boolean = () => true,
  ) => {
    const bundle = makeBundle(account)
    const activated = shouldActivate(bundle, account)
    mockRebuilds.push({account, shouldActivate: activated, bundle})
    return activated ? {bundle, account} : undefined
  },
)
jest.mock('../session-core', () => ({
  ...jest.requireActual<object>('../session-core'),
  createSessionBundleAndLogin: (...args: unknown[]) => mockLogin(...args),
  createSessionBundleAndResume: (...args: unknown[]) => mockResume(...args),
  createSessionBundleFromStoredAccount: (...args: unknown[]) =>
    // @ts-expect-error the stub's arity is checked by its own signature
    mockRebuild(...args),
  disposeBundle: (bundle: unknown) => mockDisposeBundle(bundle),
}))
jest.mock('../create-account', () => ({
  createSessionBundleAndCreateAccount: () => new Promise(() => {}),
}))

import {Provider, useSession, useSessionApi} from '#/state/session'
import {
  type OnSessionChange,
  type SessionBundle,
} from '#/state/session/session-core'
import {type SessionApiContext} from '#/state/session/types'

const DID = 'did:plc:example123'
const SERVICE = 'https://bsky.social/'

function makeAccount(overrides: Partial<SessionAccount> = {}): SessionAccount {
  return {
    service: SERVICE,
    did: DID,
    handle: 'alice.test',
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    refreshJwt: 'refresh-jwt-1',
    accessJwt: 'access-jwt-1',
    signupQueued: false,
    active: true,
    status: undefined,
    pdsUrl: undefined,
    isSelfHosted: false,
    ...overrides,
  }
}

/*
 * The provider only ever reads `bundle.agent` (for context) and
 * `bundle.session.destroyed` / `bundle.session.session` (for the cross-tab
 * token comparison), and otherwise treats a bundle as an opaque identity. A
 * literal with those fields is enough, and keeps a real PasswordSession - with
 * its network and refresh machinery - out of a suite about provider dispatch.
 */
type FakeBundle = {
  session: {destroyed: boolean; session: SessionData}
  agent: object
  service: URL
}

function makeBundle(account: SessionAccount): FakeBundle {
  return {
    session: {
      destroyed: false,
      session: {
        accessJwt: account.accessJwt ?? '',
        refreshJwt: account.refreshJwt ?? '',
        /* SessionData types these as branded strings; the values are fixtures */
        handle: account.handle as `${string}.${string}`,
        did: account.did,
        active: true,
        service: account.service,
      },
    },
    agent: {},
    service: new URL(account.service),
  }
}

type Harness = {
  api: SessionApiContext
  /** The provider's own onSessionChange, as handed to a session factory. */
  onSessionChange: OnSessionChange
  currentAccount: () => SessionAccount | undefined
  hasSession: () => boolean
}

/**
 * Render the provider, log an account in through the stubbed login factory, and
 * hand back the api plus the `onSessionChange` the factory received. Firing
 * that callback is how a test synthesizes a session event from a live bundle.
 */
async function renderLoggedIn(
  account: SessionAccount,
  bundle: FakeBundle,
): Promise<Harness> {
  let api!: SessionApiContext
  let session!: ReturnType<typeof useSession>
  function Probe() {
    api = useSessionApi()
    session = useSession()
    return null
  }
  render(
    <Provider>
      <Probe />
    </Provider>,
  )

  let captured!: OnSessionChange
  mockLogin.mockImplementationOnce((...args: unknown[]) => {
    captured = args[1] as OnSessionChange
    return Promise.resolve({bundle, account})
  })
  await act(async () => {
    await api.login({} as never, 'LoginForm')
  })

  return {
    api,
    onSessionChange: captured,
    currentAccount: () => session.currentAccount,
    hasSession: () => session.hasSession,
  }
}

/** The dying payload PasswordSession threads through its `onDeleted` hook. */
function dyingData(refreshJwt: string): SessionData {
  return {
    accessJwt: 'dead-access-jwt',
    refreshJwt,
    handle: 'alice.test',
    did: DID,
    active: true,
    service: SERVICE,
  }
}

/** The rotated payload PasswordSession threads through its `onUpdated` hook. */
function refreshedData(
  refreshJwt: string,
  didDoc?: SessionData['didDoc'],
): SessionData {
  return {
    accessJwt: 'fresh-access-jwt',
    refreshJwt,
    handle: 'alice.test',
    did: DID,
    active: true,
    service: SERVICE,
    ...(didDoc ? {didDoc} : {}),
  }
}

/** A minimal valid DID document whose only service entry is a PDS. */
function makeDidDoc(pdsUrl: string): SessionData['didDoc'] {
  return {
    id: DID,
    service: [
      {
        id: '#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: pdsUrl,
      },
    ],
  }
}

beforeEach(() => {
  mockPersisted.session = {accounts: [], currentAccount: undefined}
  mockPersisted.latest = {accounts: [], currentAccount: undefined}
  mockPersistedListeners.length = 0
  mockRebuilds.length = 0
  mockLogin.mockReset()
  mockResume.mockReset()
  mockRebuild.mockClear()
  mockDisposeBundle.mockReset()
  mockEmitSessionDropped.mockReset()
})

/*
 * A stale tab can expire a refresh token that another tab has already rotated
 * past. Logging every tab out on that event is the known-worst failure in this
 * subsystem, so the provider first looks for a newer token generation and
 * rebuilds onto it, only falling through to logout when there is nothing left
 * to try.
 */
describe('expiry rescue', () => {
  it('rebuilds onto a fresher persisted generation instead of logging out', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {onSessionChange, hasSession, currentAccount} = await renderLoggedIn(
      account,
      bundle,
    )

    /* another tab already rotated to generation 2 and wrote it to storage */
    const fresher = makeAccount({
      accessJwt: 'access-jwt-2',
      refreshJwt: 'refresh-jwt-2',
    })
    mockPersisted.latest = {accounts: [fresher], currentAccount: fresher}

    act(() => {
      onSessionChange(
        bundle as unknown as SessionBundle,
        DID,
        'expired',
        dyingData('refresh-jwt-1'),
      )
    })

    /* the rescue rebuilt onto the fresher generation ... */
    expect(mockRebuilds.length).toBe(1)
    expect(mockRebuilds[0].account.refreshJwt).toBe('refresh-jwt-2')
    /* ... and adopted it, without ever reporting the session as dropped */
    expect(hasSession()).toBe(true)
    expect(currentAccount()?.refreshJwt).toBe('refresh-jwt-2')
    expect(mockEmitSessionDropped).not.toHaveBeenCalled()
  })

  it('drops the session and logs out when there is no fresher generation', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {onSessionChange, hasSession, currentAccount} = await renderLoggedIn(
      account,
      bundle,
    )

    /* storage agrees the dying token is the newest one anybody has */
    mockPersisted.latest = {accounts: [account], currentAccount: account}

    act(() => {
      onSessionChange(
        bundle as unknown as SessionBundle,
        DID,
        'expired',
        dyingData('refresh-jwt-1'),
      )
    })

    expect(mockRebuilds.length).toBe(0)
    expect(mockEmitSessionDropped).toHaveBeenCalledTimes(1)
    expect(hasSession()).toBe(false)
    /* the reducer cleared the dead credentials rather than keeping them */
    expect(currentAccount()).toBe(undefined)
  })

  it('does not retry a generation that already failed', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {onSessionChange, hasSession} = await renderLoggedIn(account, bundle)

    const gen2 = makeAccount({
      accessJwt: 'access-jwt-2',
      refreshJwt: 'refresh-jwt-2',
    })
    mockPersisted.latest = {accounts: [gen2], currentAccount: gen2}

    /* generation 1 dies and is rescued onto generation 2 */
    act(() => {
      onSessionChange(
        bundle as unknown as SessionBundle,
        DID,
        'expired',
        dyingData('refresh-jwt-1'),
      )
    })
    expect(mockRebuilds.length).toBe(1)
    const rescued = mockRebuilds[0].bundle

    /*
     * Generation 2 dies too, and a stale tab has meanwhile written generation 1
     * back to storage. It differs from the dying token, so only the record of
     * its earlier failure can reject it.
     */
    mockPersisted.latest = {accounts: [account], currentAccount: account}
    act(() => {
      onSessionChange(
        rescued as unknown as SessionBundle,
        DID,
        'expired',
        dyingData('refresh-jwt-2'),
      )
    })

    expect(mockRebuilds.length).toBe(1)
    expect(mockEmitSessionDropped).toHaveBeenCalledTimes(1)
    expect(hasSession()).toBe(false)
  })
})

/*
 * A refresh payload only carries a didDoc when the server sends one, but
 * `pdsUrl` is never derived from the login service. If the provider does not
 * thread the stored value through, an ordinary refresh persists
 * `pdsUrl: undefined` and the next cold start routes pre-refresh requests to
 * the entryway instead of the account's PDS.
 */
describe('refresh persistence', () => {
  const PDS_HOST = 'https://shimeji.us-east.host.bsky.network'
  const DIDDOC_PDS_HOST = 'https://morel.us-west.host.bsky.network'

  it('keeps the stored pdsUrl when the refresh carries no didDoc', async () => {
    const account = makeAccount({pdsUrl: `${PDS_HOST}/`})
    const bundle = makeBundle(account)
    const {onSessionChange, currentAccount} = await renderLoggedIn(
      account,
      bundle,
    )

    act(() => {
      onSessionChange(
        bundle as unknown as SessionBundle,
        DID,
        'update',
        refreshedData('refresh-jwt-2'),
      )
    })

    expect(currentAccount()?.refreshJwt).toBe('refresh-jwt-2')
    expect(currentAccount()?.pdsUrl).toBe(`${PDS_HOST}/`)
  })

  it('prefers the didDoc endpoint over the stored pdsUrl', async () => {
    const account = makeAccount({pdsUrl: `${PDS_HOST}/`})
    const bundle = makeBundle(account)
    const {onSessionChange, currentAccount} = await renderLoggedIn(
      account,
      bundle,
    )

    act(() => {
      onSessionChange(
        bundle as unknown as SessionBundle,
        DID,
        'update',
        refreshedData('refresh-jwt-2', makeDidDoc(DIDDOC_PDS_HOST)),
      )
    })

    expect(currentAccount()?.pdsUrl).toBe(`${DIDDOC_PDS_HOST}/`)
  })
})

/** Deliver a cross-tab `persisted` update to the provider's newest listener. */
function emitSynced(session: Schema['session']) {
  mockPersistedListeners[mockPersistedListeners.length - 1](session)
}

/*
 * A `PasswordSession` cannot be patched in place, so adopting tokens another
 * tab refreshed means rebuilding the bundle. Doing that for every broadcast
 * would churn the agent (and the React tree under it) constantly, so the
 * provider rebuilds only when the tokens actually moved, and guards the swap
 * against the store having advanced underneath it.
 */
describe('cross-tab sync', () => {
  it('short-circuits an update carrying the tokens the live session already has', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {hasSession} = await renderLoggedIn(account, bundle)

    act(() => {
      emitSynced({accounts: [account], currentAccount: account})
    })

    /* identical tokens: nothing to adopt, so no rebuild */
    expect(mockRebuilds.length).toBe(0)
    expect(hasSession()).toBe(true)
  })

  it('rebuilds onto tokens another tab rotated', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {currentAccount} = await renderLoggedIn(account, bundle)

    const rotated = makeAccount({
      accessJwt: 'access-jwt-2',
      refreshJwt: 'refresh-jwt-2',
    })
    act(() => {
      emitSynced({accounts: [rotated], currentAccount: rotated})
    })

    expect(mockRebuilds.length).toBe(1)
    expect(mockRebuilds[0].account.refreshJwt).toBe('refresh-jwt-2')
    expect(currentAccount()?.refreshJwt).toBe('refresh-jwt-2')
  })

  it('declines to activate a rebuild once the store has moved past the bundle it was built for', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    await renderLoggedIn(account, bundle)

    const gen2 = makeAccount({
      accessJwt: 'access-jwt-2',
      refreshJwt: 'refresh-jwt-2',
    })
    const gen3 = makeAccount({
      accessJwt: 'access-jwt-3',
      refreshJwt: 'refresh-jwt-3',
    })

    /*
     * Two broadcasts land back to back inside one act(), so React does not
     * commit (and the effect does not re-subscribe) between them: the second
     * runs the listener registered while the ORIGINAL bundle was current, even
     * though the store has since advanced to the generation-2 rebuild.
     */
    const listener = mockPersistedListeners[mockPersistedListeners.length - 1]
    act(() => {
      listener({accounts: [gen2], currentAccount: gen2})
      listener({accounts: [gen3], currentAccount: gen3})
    })

    expect(mockRebuilds.length).toBe(2)
    expect(mockRebuilds[0].shouldActivate).toBe(true)
    /* the stale closure's bundle is no longer current, so the swap is refused */
    expect(mockRebuilds[1].account.refreshJwt).toBe('refresh-jwt-3')
    expect(mockRebuilds[1].shouldActivate).toBe(false)
  })

  it('cancels pending work when another tab logs the account out', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {api} = await renderLoggedIn(account, bundle)

    /* a resume is in flight and will resolve only after the cross-tab logout */
    const resumedBundle = makeBundle(account)
    let finishResume!: (value: unknown) => void
    mockResume.mockReturnValueOnce(
      new Promise(resolve => {
        finishResume = resolve
      }),
    )
    const pending = api.resumeSession(account)

    const loggedOut = makeAccount({accessJwt: undefined, refreshJwt: undefined})
    act(() => {
      emitSynced({accounts: [loggedOut], currentAccount: loggedOut})
    })

    await act(async () => {
      finishResume({bundle: resumedBundle, account})
      await pending
    })

    /* the superseded resume disposed its bundle rather than signing back in */
    expect(mockDisposeBundle).toHaveBeenCalledWith(resumedBundle)
    expect(mockRebuilds.length).toBe(0)
  })
})
