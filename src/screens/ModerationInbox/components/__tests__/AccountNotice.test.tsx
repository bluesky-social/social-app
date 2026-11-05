import {render, screen} from '@testing-library/react-native'

import {type tools} from '#/lexicons'
import {AccountActionTimeline} from '../AccountActionTimeline'
import {appealAction, appealReference} from '../util/accountActions'
import {getNoticeLabels} from '../util/noticeLabels'
import {YourAccountRow} from '../YourAccountRow'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
    i18n: {date: () => 'a date'},
  }),
  Trans: ({message}: {message: string}) => message,
}))
jest.mock('#/alf', () => ({
  atoms: {},
  useTheme: () => ({
    atoms: {text_contrast_medium: {}},
    palette: {primary_500: 'blue', contrast_100: 'gray', contrast_300: 'gray'},
  }),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Link', () => ({
  InlineLinkText: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('../ContentBlock', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ContentBlock: ({
      header,
      children,
    }: {
      header: string
      children: React.ReactNode
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, header),
        children,
      ),
  }
})
jest.mock('../ReportRow', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ReportRow: ({
      subject,
      action,
      to,
    }: {
      subject: string
      action?: string
      to: {params: object}
    }) =>
      React.createElement(
        Text,
        null,
        subject,
        ' ',
        action,
        ' ',
        JSON.stringify(to.params),
      ),
  }
})
jest.mock('../hooks/useActionedSubjectLabels', () => ({
  useActionedSubjectLabels: ({latestAction}: {latestAction?: {type: string}}) =>
    latestAction && {
      subject:
        latestAction.type === 'communicationSent'
          ? 'An email was sent about your account'
          : 'Your account was suspended',
    },
}))

const email = {
  id: 2,
  type: 'communicationSent',
  createdAt: '2026-01-02T00:00:00Z',
}
const takedown = {
  id: 1,
  type: 'accountTakedown',
  createdAt: '2026-01-01T00:00:00Z',
}
const subject = {
  $type: 'com.atproto.admin.defs#repoRef',
  did: 'did:plc:owner',
} as const
const detail = {
  src: 'did:plc:labeler',
  subject,
  enforcement: {state: 'takendown'},
  actions: [email, takedown],
  appeal: {state: 'pending', appealedAt: '2026-01-03T00:00:00Z'},
} as unknown as tools.ozone.inbox.getActionedSubject.$OutputBody

it('preserves the current appeal heading and suspended state after an email', () => {
  expect(getNoticeLabels(detail).header.message).toBe('Appeal under review')
  const current = getNoticeLabels({...detail, appeal: {state: 'none'}})
  expect(current.header.message).toBe('Your account is suspended')
  expect(current.date).toBe(takedown.createdAt)
  const label = {
    id: 3,
    type: 'labelApplied',
    createdAt: '2026-01-04T00:00:00Z',
  } as unknown as (typeof detail.actions)[number]
  expect(appealAction(detail, [label, ...detail.actions])?.id).toBe(takedown.id)
  expect(appealAction(detail, [label, detail.actions[0]])).toBeUndefined()
  expect(appealReference(detail)).toEqual({
    $type: 'tools.ozone.inbox.appealActionedSubject#takedownRef',
  })
  expect(
    getNoticeLabels({
      ...detail,
      appeal: {
        state: 'resolved',
        outcome: 'denied',
        resolvedAt: '2026-01-01T12:00:00Z',
      },
    }).header.message,
  ).toBe('Appeal denied')
})

it('shows one subject row and the separate actions in its details timeline', () => {
  const item = {
    ...detail,
    latestAction: email,
    isRead: false,
    createdAt: takedown.createdAt,
    updatedAt: email.createdAt,
  } as tools.ozone.inbox.listActionedSubjects.$OutputBody['subjects'][number]
  const row = render(<YourAccountRow item={item} unread />)
  expect(screen.getByText(/Your account is suspended/)).toBeTruthy()
  expect(screen.queryByText(/An email was sent/)).toBeNull()
  expect(screen.getByText(/moderationService/)).toBeTruthy()
  expect(screen.getByText(/Appeal under review/)).toBeTruthy()
  expect(screen.queryByText(/actionId/)).toBeNull()
  row.unmount()

  const laterSuspension = {
    ...item,
    latestAction: detail.actions[1],
    appeal: {
      state: 'resolved',
      outcome: 'approved',
      resolvedAt: '2025-12-31T00:00:00Z',
    },
  } as typeof item
  const laterRow = render(<YourAccountRow item={laterSuspension} unread />)
  expect(screen.queryByText(/Appeal approved/)).toBeNull()
  laterRow.unmount()

  const afterEmail = {
    ...item,
    appeal: {
      state: 'resolved',
      outcome: 'denied',
      resolvedAt: '2026-01-01T12:00:00Z',
    },
  } as typeof item
  const emailRow = render(<YourAccountRow item={afterEmail} unread />)
  expect(screen.getByText(/Previous appeal denied/)).toBeTruthy()
  emailRow.unmount()

  render(<AccountActionTimeline data={detail} actions={detail.actions} />)
  expect(screen.getByText('Timeline')).toBeTruthy()
  expect(screen.getByText('An email was sent about your account')).toBeTruthy()
  expect(screen.getByText('Your account was suspended')).toBeTruthy()
  expect(screen.queryByText(/2026/)).toBeNull()
})
