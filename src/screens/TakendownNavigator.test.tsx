import {fireEvent, render, waitFor} from '@testing-library/react-native'

import {Provider as PortalProvider} from '#/components/Portal'
import {TakendownNavigator} from './TakendownNavigator'

let mockShowLoggedOut = false

jest.mock('#/env', () => ({IS_NATIVE: true}))
jest.mock('#/lib/hooks/useNotificationHandler', () => ({
  useNotificationsHandler: () => {},
}))
jest.mock('#/lib/notifications/notifications', () => ({
  useNotificationsRegistration: () => {},
}))
jest.mock('#/state/shell/logged-out', () => ({
  useLoggedOutView: () => ({showLoggedOut: mockShowLoggedOut}),
  useLoggedOutViewControls: () => ({setShowLoggedOut: jest.fn()}),
}))
jest.mock('#/view/com/auth/LoggedOut', () => ({
  LoggedOut: () => {
    const {Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>Sign in</Text>
  },
}))
jest.mock('@bsky.app/bottom-sheet', () => ({
  BottomSheetOutlet: () => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="bottom-sheet-outlet" />
  },
}))
jest.mock('#/Navigation', () => ({
  RoutesContainer: ({children}: {children: React.ReactNode}) => {
    const {NavigationContainer} = jest.requireActual<
      typeof import('@react-navigation/native')
    >('@react-navigation/native')
    return <NavigationContainer>{children}</NavigationContainer>
  },
}))
jest.mock('#/screens/Takendown', () => ({
  Takendown: () => {
    const {Button} =
      jest.requireActual<typeof import('react-native')>('react-native')
    const {useNavigation} = jest.requireActual<
      typeof import('@react-navigation/native')
    >('@react-navigation/native')
    const navigation = useNavigation<{
      navigate: (destination: {
        name: 'ModerationInbox'
        params: {tab: 'account'}
      }) => void
    }>()
    return (
      <Button
        title="Open inbox"
        onPress={() =>
          navigation.navigate({
            name: 'ModerationInbox',
            params: {tab: 'account'},
          })
        }
      />
    )
  },
}))
jest.mock('#/screens/ModerationInbox', () => ({
  ModerationInboxScreen: () => {
    const {Button, Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    const {useState} = jest.requireActual<typeof import('react')>('react')
    const {Portal} = jest.requireActual<typeof import('#/components/Portal')>(
      '#/components/Portal',
    )
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button title="Open appeal" onPress={() => setOpen(true)} />
        {open && (
          <Portal>
            <Text>Appeal dialog</Text>
          </Portal>
        )}
      </>
    )
  },
}))
jest.mock('#/screens/ModerationInbox/Notice', () => ({
  ModerationInboxNoticeDetailsScreen: () => null,
}))
jest.mock('#/screens/ModerationInbox/Report', () => ({
  ModerationInboxReportDetailsScreen: () => null,
}))
jest.mock('#/screens/ModerationInbox/Settings', () => ({
  ModerationInboxSettingsScreen: () => null,
}))

afterEach(() => {
  mockShowLoggedOut = false
})

it('opens the inbox and renders dialog outlets for a restricted account', async () => {
  const screen = render(
    <PortalProvider>
      <TakendownNavigator />
    </PortalProvider>,
  )
  fireEvent.press(screen.getByText('Open inbox'))
  await waitFor(() => expect(screen.getByText('Open appeal')).toBeTruthy())
  fireEvent.press(screen.getByText('Open appeal'))
  await waitFor(() => expect(screen.getByText('Appeal dialog')).toBeTruthy())
  expect(screen.getByTestId('bottom-sheet-outlet')).toBeTruthy()
})

it('shows sign-in when an account switch needs authentication', () => {
  mockShowLoggedOut = true
  const screen = render(<TakendownNavigator />)
  expect(screen.getByText('Sign in')).toBeTruthy()
})
