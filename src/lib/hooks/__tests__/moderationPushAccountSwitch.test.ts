import {
  storePayloadForAccountSwitch,
  takeStoredModerationPush,
} from '../useNotificationHandler'

jest.mock('#/Navigation', () => ({}))
jest.mock('#/analytics', () => ({}))
jest.mock('#/lib/hooks/useAccountSwitcher', () => ({}))
jest.mock('#/lib/notifications/util', () => ({logger: {}}))
jest.mock('#/lib/routes/navigation', () => ({}))
jest.mock('#/state/events', () => ({}))
jest.mock('#/state/messages/current-convo-id', () => ({}))
jest.mock('#/state/session', () => ({}))
jest.mock('#/state/shell/logged-out', () => ({}))
jest.mock('#/state/util', () => ({}))
jest.mock('#/routes', () => ({}))

it('keeps a push until its recipient account is ready, then consumes it once', () => {
  const payload = {
    reason: 'moderation-inbox' as const,
    version: '1' as const,
    recipientDid: 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb',
    serviceDid: 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa',
    section: 'reports' as const,
    reportId: '42',
  }
  storePayloadForAccountSwitch(payload)
  expect(takeStoredModerationPush('did:plc:other')).toBeUndefined()
  expect(takeStoredModerationPush(payload.recipientDid)).toEqual(payload)
  expect(takeStoredModerationPush(payload.recipientDid)).toBeUndefined()
})
