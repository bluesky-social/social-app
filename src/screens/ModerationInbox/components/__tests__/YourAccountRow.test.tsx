import {render, screen} from '@testing-library/react-native'

import {YourAccountRow} from '../YourAccountRow'

jest.mock('../hooks/useActionedSubjectLabels', () => ({
  useActionedSubjectLabels: () => ({subject: 'Account action'}),
}))
jest.mock('../ReportRow', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ReportRow: ({
      to,
    }: {
      to: {params: {actionId?: string; actionCursor?: string}}
    }) => <Text>{`${to.params.actionId}:${to.params.actionCursor}`}</Text>,
  }
})

it('links the chosen account action and its history page', () => {
  const action = {
    id: 42,
    type: 'accountTakedown',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
  const item = {
    src: 'did:plc:moderation',
    subject: {$type: 'com.atproto.admin.defs#repoRef', did: 'did:plc:owner'},
    enforcement: {state: 'takendown'},
    latestAction: action,
    isRead: false,
    createdAt: action.createdAt,
    updatedAt: action.createdAt,
  } as React.ComponentProps<typeof YourAccountRow>['item']

  render(
    <YourAccountRow
      item={item}
      action={item.latestAction}
      actionCursor="older"
      unread
    />,
  )
  expect(screen.getByText('42:older')).toBeTruthy()
})
