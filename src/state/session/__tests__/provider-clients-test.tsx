import {type Client} from '@atproto/lex'
import {PasswordSession} from '@atproto/lex-password-session'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

import {type SessionAccount} from '../types'

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, mirroring provider-abort-test.tsx.
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

import {
  Provider,
  useAppviewClient,
  useChatClient,
  useMaybeChatClient,
  useMaybePdsClient,
  usePdsClient,
  useSessionApi,
} from '#/state/session'
import {type SessionApiContext} from '#/state/session/types'
import {
  buildAppviewClient,
  buildChatClient,
  buildPdsClient,
  getUnauthenticatedThrowingClient,
} from '../clients'
import {type SessionBundle} from '../session-core'
import {sessionAccountToSessionData} from '../session-data'
import {asFetch, makeAccount, makeMockFetch} from './mock-fetch'

type Clients = {
  appview: Client
  pds: Client
  chat: Client
  maybePds: Client | null
  maybeChat: Client | null
}

/**
 * Build a bundle over a real `PasswordSession`, with the three clients the
 * provider serves. Only the fields the provider reads are populated.
 */
function makeBundle(account: SessionAccount): SessionBundle {
  const fetchMock = makeMockFetch()
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

/** Render the provider and hand back the client hooks' current values. */
function renderClients(): {api: SessionApiContext; clients: () => Clients} {
  let api!: SessionApiContext
  let clients!: Clients
  function Probe() {
    api = useSessionApi()
    clients = {
      appview: useAppviewClient(),
      pds: usePdsClient(),
      chat: useChatClient(),
      maybePds: useMaybePdsClient(),
      maybeChat: useMaybeChatClient(),
    }
    return null
  }
  render(
    <Provider>
      <Probe />
    </Provider>,
  )
  return {api, clients: () => clients}
}

beforeEach(() => {
  mockLogin.mockReset()
})

describe('client hooks while logged out', () => {
  it('serves the public client for appview reads', () => {
    const {clients} = renderClients()
    expect(clients().appview).toBeDefined()
    /* the logged-out bundle holds the public appview client itself */
    expect(clients().appview.did).toBeUndefined()
  })

  it('serves the throwing client for the write surfaces', () => {
    const {clients} = renderClients()
    const throwing = getUnauthenticatedThrowingClient()
    expect(clients().pds).toBe(throwing)
    expect(clients().chat).toBe(throwing)
  })

  it('serves null from the maybe variants', () => {
    const {clients} = renderClients()
    expect(clients().maybePds).toBeNull()
    expect(clients().maybeChat).toBeNull()
  })
})

describe('client hooks with a session', () => {
  it('serves every surface straight off the session bundle', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {api, clients} = renderClients()

    mockLogin.mockResolvedValueOnce({bundle, account})
    await act(async () => {
      await api.login({} as never, 'LoginForm')
    })

    expect(clients().appview).toBe(bundle.appviewClient)
    expect(clients().pds).toBe(bundle.pdsClient)
    expect(clients().chat).toBe(bundle.chatClient)
  })

  it('serves the same clients from the maybe variants', async () => {
    const account = makeAccount()
    const bundle = makeBundle(account)
    const {api, clients} = renderClients()

    mockLogin.mockResolvedValueOnce({bundle, account})
    await act(async () => {
      await api.login({} as never, 'LoginForm')
    })

    expect(clients().maybePds).toBe(clients().pds)
    expect(clients().maybeChat).toBe(clients().chat)
  })
})
