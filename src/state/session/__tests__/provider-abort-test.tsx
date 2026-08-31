import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

let mockWriteSessionError: Error | undefined
const mockAnalyticsLoggerWarn = jest.fn()

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, which is all these tests drive.
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
  useAnalyticsBase: () => ({
    metric() {},
    logger: {
      debug() {},
      error() {},
      warn: (...args: unknown[]) => mockAnalyticsLoggerWarn(...args),
    },
  }),
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

/*
 * The factories are stubbed so a test controls exactly when each one resolves,
 * which is what lets a second call abort the first while it is in flight.
 * `disposeBundle` is spied on rather than replaced wholesale: the rest of
 * session-core stays real so the provider's own module graph is unchanged.
 */
const mockLogin = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockCreateAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockDisposeBundle = jest.fn()
jest.mock('../session-core', () => ({
  ...jest.requireActual<object>('../session-core'),
  createSessionBundleAndLogin: (...args: unknown[]) => mockLogin(...args),
  disposeBundle: (bundle: unknown) => mockDisposeBundle(bundle),
}))
jest.mock('../create-account', () => ({
  createSessionBundleAndCreateAccount: (...args: unknown[]) =>
    mockCreateAccount(...args),
}))

import {Provider, useSessionApi} from '#/state/session'
import {type SessionApiContext} from '#/state/session/types'

/** Render the provider and hand back its api context. */
function renderProvider(): SessionApiContext {
  let api!: SessionApiContext
  function Probe() {
    api = useSessionApi()
    return null
  }
  render(
    <Provider>
      <Probe />
    </Provider>,
  )
  return api
}

beforeEach(() => {
  mockLogin.mockReset()
  mockCreateAccount.mockReset()
  mockDisposeBundle.mockReset()
  mockWriteSessionError = undefined
  mockAnalyticsLoggerWarn.mockReset()
})

/*
 * Every factory returns an ARMED bundle, so a call whose result is thrown away
 * because a newer call superseded it must dispose that bundle. Leaving it armed
 * leaves a live session auto-refreshing and rotating refresh tokens server-side
 * for an account the app is no longer tracking.
 */
describe('superseded session tasks dispose their bundle', () => {
  it('disposes the bundle of an aborted login', async () => {
    const bundle = {tag: 'login-bundle'} as never
    let resolveLogin!: (value: unknown) => void
    mockLogin.mockReturnValueOnce(
      new Promise(resolve => {
        resolveLogin = resolve
      }),
    )
    const api = renderProvider()

    const superseded = api.login({} as never, 'LoginForm')
    /* the second call aborts the first task's signal, and never settles */
    mockLogin.mockReturnValueOnce(new Promise(() => {}))
    void api.login({} as never, 'LoginForm')

    await act(async () => {
      resolveLogin({bundle, account: {did: 'did:plc:example'}})
      await superseded
    })

    expect(mockDisposeBundle).toHaveBeenCalledWith(bundle)
  })

  it('disposes the bundle of an aborted createAccount', async () => {
    const bundle = {tag: 'create-account-bundle'} as never
    let resolveCreate!: (value: unknown) => void
    mockCreateAccount.mockReturnValueOnce(
      new Promise(resolve => {
        resolveCreate = resolve
      }),
    )
    const api = renderProvider()

    const superseded = api.createAccount({} as never, {} as never)
    mockCreateAccount.mockReturnValueOnce(new Promise(() => {}))
    void api.createAccount({} as never, {} as never)

    await act(async () => {
      resolveCreate({bundle, account: {did: 'did:plc:example'}})
      await superseded
    })

    expect(mockDisposeBundle).toHaveBeenCalledWith(bundle)
  })
})

describe('persistence failures after an in-memory commit', () => {
  const account = {
    did: 'did:plc:example',
    handle: 'alice.test',
    service: 'https://bsky.social/',
    accessJwt: 'access-jwt',
    refreshJwt: 'refresh-jwt',
  }

  it('treats login as successful and logs a warning', async () => {
    const error = new Error('storage failed')
    mockLogin.mockResolvedValueOnce({bundle: {}, account})
    mockWriteSessionError = error
    const api = renderProvider()

    await act(async () => {
      await api.login({} as never, 'LoginForm')
    })

    expect(mockAnalyticsLoggerWarn).toHaveBeenCalledWith(
      'Logged in but session persistence failed',
      {safeMessage: error},
    )
  })

  it('treats account creation as successful and logs a warning', async () => {
    const error = new Error('storage failed')
    mockCreateAccount.mockResolvedValueOnce({bundle: {}, account})
    mockWriteSessionError = error
    const api = renderProvider()

    await act(async () => {
      await api.createAccount({} as never, {} as never)
    })

    expect(mockAnalyticsLoggerWarn).toHaveBeenCalledWith(
      'Account created but session persistence failed',
      {safeMessage: error},
    )
  })

  it('keeps refreshed metadata and logs a warning', async () => {
    const error = new Error('storage failed')
    const bundle = {
      pdsClient: {
        call: () =>
          Promise.resolve({
            did: account.did,
            emailConfirmed: true,
            emailAuthFactor: true,
          }),
      },
    }
    mockLogin.mockResolvedValueOnce({bundle, account})
    const api = renderProvider()
    await act(async () => {
      await api.login({} as never, 'LoginForm')
    })
    mockWriteSessionError = error

    await act(async () => {
      await api.partialRefreshSession()
    })

    expect(mockAnalyticsLoggerWarn).toHaveBeenCalledWith(
      'Session metadata updated but persistence failed',
      {safeMessage: error},
    )
  })
})
