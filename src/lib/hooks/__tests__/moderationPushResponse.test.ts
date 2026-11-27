import * as Notifications from 'expo-notifications'
import {act, renderHook} from '@testing-library/react-native'

import {
  storePayloadForAccountSwitch,
  takeStoredModerationPush,
  useNotificationsHandler,
} from '../useNotificationHandler'

const mockSwitchAccount = jest.fn()
const mockClose = jest.fn()
const mockSetShowLoggedOut = jest.fn()
let mockPendingDid: string | null = null
let mockResponseListener: (response: Notifications.NotificationResponse) => void
const mockAccounts = [
  {did: 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb'},
  {did: 'did:plc:cccccccccccccccccccccccc'},
]
const mockLogger = {debug: jest.fn(), error: jest.fn()}
const mockAnalytics = {
  logger: {
    useChild: () => mockLogger,
    Context: {Notifications: 'notifications'},
  },
  metric: jest.fn(),
}

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'default',
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(listener => {
    mockResponseListener = listener
    return {remove: jest.fn()}
  }),
  dismissAllNotificationsAsync: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}))
jest.mock('@lingui/react', () => ({useLingui: () => ({_: jest.fn()})}))
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({})}))
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({invalidateQueries: jest.fn()}),
}))
jest.mock('#/env', () => ({IS_ANDROID: false, IS_IOS: false}))
jest.mock('#/Navigation', () => ({isNavigationReady: () => true}))
jest.mock('#/analytics', () => ({useAnalytics: () => mockAnalytics}))
jest.mock('#/lib/hooks/useAccountSwitcher', () => ({
  useAccountSwitcher: () => ({
    onPressSwitchAccount: mockSwitchAccount,
    pendingDid: mockPendingDid,
  }),
}))
jest.mock('#/lib/notifications/util', () => ({logger: {}}))
jest.mock('#/lib/routes/navigation', () => ({}))
jest.mock('#/state/events', () => ({}))
jest.mock('#/state/messages/current-convo-id', () => ({
  useCurrentConvoId: () => ({}),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {did: 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'},
    accounts: mockAccounts,
  }),
}))
jest.mock('#/state/shell/logged-out', () => ({
  useLoggedOutViewControls: () => ({setShowLoggedOut: mockSetShowLoggedOut}),
}))
jest.mock('#/state/util', () => ({useCloseAllActiveElements: () => mockClose}))
jest.mock('#/routes', () => ({}))

const payload = {
  reason: 'moderation-inbox' as const,
  version: '1' as const,
  recipientDid: mockAccounts[0].did,
  serviceDid: 'did:plc:dddddddddddddddddddddddd',
  section: 'reports' as const,
  reportId: '42',
}

function tapPush(data: typeof payload, date: number) {
  act(() => {
    mockResponseListener({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        date,
        request: {trigger: {type: 'push'}, content: {data}},
      },
    } as unknown as Notifications.NotificationResponse)
  })
}

afterEach(() => {
  storePayloadForAccountSwitch(undefined)
  mockPendingDid = null
  jest.clearAllMocks()
})

it('replaces a stale push and switches to the recipient of a later tap', () => {
  storePayloadForAccountSwitch(payload)
  renderHook(() => useNotificationsHandler())

  const next = {...payload, recipientDid: mockAccounts[1].did, reportId: '43'}
  tapPush(next, 101)

  expect(mockSwitchAccount).toHaveBeenCalledWith(
    mockAccounts[1],
    'Notification',
  )
  expect(takeStoredModerationPush(next.recipientDid)).toEqual(next)
})

it('preserves an ongoing switch when a different account receives a tap', () => {
  mockPendingDid = payload.recipientDid
  storePayloadForAccountSwitch(payload)
  renderHook(() => useNotificationsHandler())

  tapPush({...payload, recipientDid: mockAccounts[1].did}, 102)

  expect(mockSwitchAccount).not.toHaveBeenCalled()
  expect(takeStoredModerationPush(payload.recipientDid)).toEqual(payload)
})

it('updates the destination for another tap on the account being switched to', () => {
  mockPendingDid = payload.recipientDid
  storePayloadForAccountSwitch(payload)
  renderHook(() => useNotificationsHandler())

  const next = {...payload, reportId: '43'}
  tapPush(next, 103)

  expect(mockSwitchAccount).not.toHaveBeenCalled()
  expect(takeStoredModerationPush(payload.recipientDid)).toEqual(next)
})
