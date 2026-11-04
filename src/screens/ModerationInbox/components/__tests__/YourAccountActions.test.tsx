import {fireEvent, render, screen} from '@testing-library/react-native'

import {useModerationInboxSubjectQuery} from '#/state/queries/moderation-inbox'
import {YourAccountActions} from '../YourAccountActions'

jest.mock('#/state/queries/moderation-inbox', () => ({
  useModerationInboxSubjectQuery: jest.fn(),
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
  }),
  Trans: ({message}: {message: string}) => message,
}))
jest.mock('#/alf', () => ({atoms: {p_lg: {}, align_start: {}}}))
jest.mock('#/view/com/util/error/ErrorMessage', () => ({
  ErrorMessage: () => null,
}))
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
)
jest.mock('#/components/Button', () => {
  const {Pressable, Text} = jest.requireActual('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
    }: {
      children: React.ReactNode
      label: string
      onPress: () => void
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonText: Text,
  }
})
jest.mock('../YourAccountRow', () => {
  const {Text} = jest.requireActual('react-native')
  return {
    YourAccountRow: ({
      item,
      action,
      actionCursor,
      unread,
    }: {
      item: {latestAction: {type: string}}
      action?: {type: string}
      actionCursor?: string
      unread: boolean
    }) => (
      <Text>{`${action?.type ?? item.latestAction.type}:${actionCursor ?? 'first'}:${unread}`}</Text>
    ),
  }
})

const mockHistory = jest.mocked(useModerationInboxSubjectQuery)
const item = {
  src: 'did:plc:moderation',
  subject: {$type: 'com.atproto.admin.defs#repoRef', did: 'did:plc:owner'},
  enforcement: {state: 'takendown'},
  latestAction: {
    id: 2,
    type: 'communicationSent',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  isRead: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
} as React.ComponentProps<typeof YourAccountActions>['item']

it('shows each account action and loads older history', () => {
  const fetchNextPage = jest.fn()
  mockHistory.mockReturnValue({
    data: {
      pages: [
        {actions: [{id: 2, type: 'communicationSent'}]},
        {actions: [{id: 1, type: 'accountTakedown'}]},
      ],
      pageParams: [undefined, 'older-cursor'],
    },
    hasNextPage: true,
    fetchNextPage,
  } as never)
  render(<YourAccountActions item={item} />)

  expect(screen.getByText('communicationSent:first:true')).toBeTruthy()
  expect(screen.getByText('accountTakedown:older-cursor:false')).toBeTruthy()
  fireEvent.press(
    screen.getByRole('button', {name: 'Load older account actions'}),
  )
  expect(fetchNextPage).toHaveBeenCalledTimes(1)
})

it('keeps the latest action visible while history loads', () => {
  mockHistory.mockReturnValue({} as never)
  render(<YourAccountActions item={item} />)
  expect(screen.getByText('communicationSent:first:true')).toBeTruthy()
})
