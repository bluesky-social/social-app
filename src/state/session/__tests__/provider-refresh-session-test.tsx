import {PasswordSession} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

import {type SessionAccount} from '../types'

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, mirroring provider-clients-test.tsx.
 */
jest.mock('#/state/persisted', () => {
  const {
    defaults,
  }: typeof import('#/state/persisted/schema') = require('#/state/persisted/schema')
  return {
    defaults,
    get: (key: keyof typeof defaults) => defaults[key],
    write: () => Promise.resolve(),
    readLatest: (key: keyof typeof defaults) => defaults[key],
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
import {type SessionBundle} from '../session-core'
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
): SessionBundle {
  const session = new PasswordSession(sessionAccountToSessionData(account), {
    fetch: asFetch(fetchMock),
  })
  return {
    session,
    appviewClient: buildAppviewClient(session),
    pdsClient: buildPdsClient(session),
    chatClient: buildChatClient(session),
    service: new URL(account.service),
  }
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
  const bundle = makeBundle(account, fetchMock)
  const harness = renderProvider()
  mockLogin.mockResolvedValueOnce({bundle, account})
  await act(async () => {
    await harness.api.login({} as never, 'LoginForm')
  })
  return harness
}

beforeEach(() => {
  mockLogin.mockReset()
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

  it('exposes the fresh tokens before the store has caught up', async () => {
    const fetchMock = makeMockFetch()
    const {api, currentAccount} = await renderLoggedIn(makeAccount(), fetchMock)

    /*
     * The point of the return value: `SignupQueued` branches on the fresh
     * accessJwt synchronously, without waiting for `onUpdated` -> dispatch ->
     * re-render.
     */
    let refreshed: SessionAccount | undefined
    const before = currentAccount()?.accessJwt
    await act(async () => {
      refreshed = await api.refreshSession()
    })
    expect(before).toBe('access-jwt')
    expect(refreshed?.accessJwt).toBe('access-jwt-2')
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
