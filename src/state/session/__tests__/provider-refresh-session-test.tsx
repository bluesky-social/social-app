import {PasswordSession} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

import {type SessionAccount} from '../types'

let mockWriteSessionError: Error | undefined
const mockLoggerError = jest.fn()
jest.mock('#/logger', () => {
  const logger = {
    debug() {},
    info() {},
    log() {},
    warn() {},
    error: (...args: unknown[]) => mockLoggerError(...args),
  }
  return {
    logger,
    Logger: {
      create: () => logger,
      Context: new Proxy({}, {get: (_target, key) => String(key)}),
      Level: {},
    },
  }
})

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, mirroring provider-clients-test.tsx.
 */
jest.mock('#/state/persisted', () => {
  const actual = jest.requireActual<object>('#/state/persisted')
  const {
    defaults,
  }: typeof import('#/state/persisted/schema') = require('#/state/persisted/schema')
  return {
    ...actual,
    get: () => defaults.session,
    readLatest: () => defaults.session,
    writeSession: ({nextSession}: {nextSession: typeof defaults.session}) =>
      mockWriteSessionError
        ? Promise.reject(mockWriteSessionError)
        : Promise.resolve(nextSession),
    onUpdate: () => () => {},
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
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({scope: 'com.atproto.access'}),
}))
jest.mock('#/state/events', () => ({
  emitSessionDropped: () => {},
  emitNetworkConfirmed: () => {},
  emitNetworkLost: () => {},
}))

const mockLogin = jest.fn<(...args: unknown[]) => Promise<unknown>>()
jest.mock('../session-core', () => ({
  ...jest.requireActual<object>('../session-core'),
  createSessionBundleAndLogin: (...args: unknown[]) => mockLogin(...args),
}))
jest.mock('../create-account', () => ({
  createSessionBundleAndCreateAccount: () => new Promise(() => {}),
}))

import {Provider, useSession, useSessionApi} from '#/state/session'
import {type SessionApiContext} from '#/state/session/types'
import {buildAppviewClient, buildChatClient, buildPdsClient} from '../clients'
import {
  makeSessionHooks,
  type OnSessionChange,
  type SessionBundle,
} from '../session-core'
import {sessionAccountToSessionData} from '../session-data'
import {
  asFetch,
  DID,
  HANDLE,
  json,
  makeAccount,
  makeMockFetch,
  type MockFetch,
} from './mock-fetch'

/**
 * Build a bundle whose session is a real `PasswordSession` over the stubbed
 * network, since `refreshSession` drives the session's own refresh machinery.
 */
function makeBundle(
  account: SessionAccount,
  fetchMock: MockFetch,
  onSessionChange: OnSessionChange,
): SessionBundle {
  let bundle!: SessionBundle
  const hooks = makeSessionHooks({
    onSessionChange,
    getBundle: () => bundle,
    getDid: () => account.did,
  })
  const session = new PasswordSession(sessionAccountToSessionData(account), {
    ...hooks,
    fetch: asFetch(fetchMock),
  })
  bundle = {
    session,
    appviewClient: buildAppviewClient(session),
    pdsClient: buildPdsClient(session),
    chatClient: buildChatClient(session),
    service: new URL(account.service),
  }
  hooks.arm()
  return bundle
}

type Harness = {
  api: SessionApiContext
  currentAccount: () => SessionAccount | undefined
}

function renderProvider(): Harness {
  let api!: SessionApiContext
  let currentAccount: SessionAccount | undefined
  function Probe() {
    api = useSessionApi()
    currentAccount = useSession().currentAccount
    return null
  }
  render(
    <Provider>
      <Probe />
    </Provider>,
  )
  return {api, currentAccount: () => currentAccount}
}

/** Render the provider and log `account` in through the stubbed login factory. */
async function renderLoggedIn(
  account: SessionAccount,
  fetchMock: MockFetch,
): Promise<Harness> {
  const harness = renderProvider()
  mockLogin.mockImplementationOnce((...args: unknown[]) => {
    const onSessionChange = args[1] as OnSessionChange
    const bundle = makeBundle(account, fetchMock, onSessionChange)
    return Promise.resolve({bundle, account})
  })
  await act(async () => {
    await harness.api.login({} as never, 'LoginForm')
  })
  return harness
}

beforeEach(() => {
  mockLogin.mockReset()
  mockLoggerError.mockReset()
  mockWriteSessionError = undefined
})

describe('refreshSession', () => {
  it('resolves with the rotated account snapshot', async () => {
    const fetchMock = makeMockFetch()
    const {api} = await renderLoggedIn(makeAccount(), fetchMock)

    let refreshed: SessionAccount | undefined
    await act(async () => {
      refreshed = await api.refreshSession()
    })

    /* the mock's refresh response rotates both tokens */
    expect(refreshed?.accessJwt).toBe('access-jwt-2')
    expect(refreshed?.refreshJwt).toBe('refresh-jwt-2')
    expect(refreshed?.did).toBe(DID)
    expect(refreshed?.handle).toBe(HANDLE)
  })

  it("returns fresh tokens instead of relying on the caller's account snapshot", async () => {
    const fetchMock = makeMockFetch()
    const {api, currentAccount} = await renderLoggedIn(makeAccount(), fetchMock)

    /*
     * The point of the return value: `SignupQueued` branches on the fresh
     * accessJwt rather than the account snapshot its callback captured before
     * awaiting the refresh.
     */
    let refreshed: SessionAccount | undefined
    const before = currentAccount()?.accessJwt
    await act(async () => {
      refreshed = await api.refreshSession()
    })
    expect(before).toBe('access-jwt')
    expect(refreshed?.accessJwt).toBe('access-jwt-2')
  })

  it('reports persistence failure without poisoning PasswordSession', async () => {
    const fetchMock = makeMockFetch()
    const {api} = await renderLoggedIn(makeAccount(), fetchMock)
    const persistenceError = new Error('storage failed')
    mockWriteSessionError = persistenceError

    /*
     * PasswordSession awaits onUpdated inside its shared session promise. The
     * hook must catch this rejection or every later refresh and request would
     * inherit the rejected promise. The provider retrieves the caught error
     * through takeSessionChangeError so this explicit operation still fails.
     */
    let refreshError: unknown
    await act(async () => {
      try {
        await api.refreshSession()
      } catch (error) {
        refreshError = error
      }
    })
    expect(refreshError).toBe(persistenceError)
    expect(mockLoggerError).toHaveBeenCalledWith(persistenceError, {
      message: "session: onSessionChange threw for a 'update' event",
    })

    /*
     * A second network refresh proves the hook rejection did not poison that
     * shared promise. Clearing the simulated failure lets the path complete.
     */
    mockWriteSessionError = undefined
    let refreshed: SessionAccount | undefined
    await act(async () => {
      refreshed = await api.refreshSession()
    })
    expect(refreshed?.refreshJwt).toBe('refresh-jwt-2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves with undefined when logged out', async () => {
    const {api} = renderProvider()

    let refreshed: SessionAccount | undefined = makeAccount()
    await act(async () => {
      refreshed = await api.refreshSession()
    })

    expect(refreshed).toBeUndefined()
  })

  it('rejects when the refresh rotated nothing', async () => {
    /*
     * A transient failure: `PasswordSession.refresh()` reports through
     * `onUpdateFailure` and resolves with the SAME data object. Callers read
     * resolution as "tokens rotated", so this must reject.
     */
    const fetchMock = makeMockFetch({
      'com.atproto.server.refreshSession': () =>
        json({error: 'InternalServerError'}, 500),
    })
    const {api} = await renderLoggedIn(makeAccount(), fetchMock)

    await expect(
      act(async () => {
        await api.refreshSession()
      }),
    ).rejects.toThrow('Failed to refresh session')
  })
})
