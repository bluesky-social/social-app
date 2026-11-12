import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, which is all these tests drive.
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
const mockClearPersistedQueryStorage = jest.fn((_id: string) =>
  Promise.resolve(),
)
jest.mock('#/lib/persisted-query-storage', () => ({
  clearPersistedQueryStorage: (id: string) =>
    mockClearPersistedQueryStorage(id),
}))
jest.mock('#/lib/notifications/notifications', () => ({
  unregisterPushToken: () => Promise.resolve(),
}))
jest.mock('jwt-decode', () => ({jwtDecode: () => ({})}))
jest.mock('../create-account', () => ({
  createSessionBundleAndCreateAccount: () => new Promise(() => {}),
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

/*
 * Each account's query cache is persisted to its own store, and only that
 * account's provider ever expires it. Once an account is gone from the device
 * nothing would mount that provider again, so its store must be cleared here
 * or it is orphaned forever.
 */
describe('removing an account', () => {
  beforeEach(() => {
    mockClearPersistedQueryStorage.mockClear()
  })

  it("clears the account's persisted query cache", () => {
    const api = renderProvider()

    act(() => {
      api.removeAccount({did: 'did:plc:removed'} as never)
    })

    expect(mockClearPersistedQueryStorage).toHaveBeenCalledWith(
      'did:plc:removed',
    )
  })
})
