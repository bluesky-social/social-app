import {StyleSheet} from 'react-native'
import {act, fireEvent, render} from '@testing-library/react-native'

import * as Dialog from '#/components/Dialog'
import {DesktopLeftNav} from './LeftNav'

const mockCurrentAccount = {
  did: 'did:plc:current',
  handle: 'current.example',
}
const mockAccounts = [
  mockCurrentAccount,
  {did: 'did:plc:alpha', handle: 'alpha.example'},
  {did: 'did:plc:beta', handle: 'beta.example'},
]
const mockProfiles = [
  {
    did: mockCurrentAccount.did,
    handle: mockCurrentAccount.handle,
    displayName: 'Current',
  },
  {
    did: 'did:plc:alpha',
    handle: 'alpha.profile',
    displayName: 'Alpha',
  },
]
const mockSwitchAccount = jest.fn()
let mockPendingDid: string | null = null

jest.mock('#/env', () => ({
  __esModule: true,
  IS_IOS: true,
  IS_NATIVE: true,
  IS_WEB: false,
  IS_ANDROID: false,
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    hasSession: true,
    currentAccount: mockCurrentAccount,
    accounts: mockAccounts,
  }),
  useSessionApi: () => ({logoutEveryAccount: jest.fn()}),
}))
jest.mock('#/state/queries/profile', () => ({
  useProfilesQuery: () => ({isLoading: false, data: {profiles: mockProfiles}}),
}))
jest.mock('#/lib/hooks/useAccountSwitcher', () => ({
  useAccountSwitcher: () => ({
    onPressSwitchAccount: mockSwitchAccount,
    pendingDid: mockPendingDid,
  }),
}))
jest.mock('#/lib/hooks/useOpenComposer', () => ({
  useOpenComposer: () => ({openComposer: jest.fn()}),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn(), getState: () => ({routes: []})}),
  useNavigationState: (selector: (state: unknown) => unknown) =>
    selector({routes: [{name: 'Home'}]}),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}))
jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => undefined,
}))
jest.mock('#/state/queries/messages/list-conversations', () => ({
  useUnreadMessageCount: () => ({numUnread: undefined, hasNew: false}),
}))
jest.mock('#/state/queries/handle', () => ({useFetchHandle: () => jest.fn()}))
jest.mock('#/state/shell/logged-out', () => ({
  useLoggedOutViewControls: () => ({setShowLoggedOut: jest.fn()}),
}))
jest.mock('#/state/util', () => ({
  useCloseAllActiveElements: () => jest.fn(),
}))
jest.mock('#/ageAssurance', () => ({
  useAgeAssurance: () => ({
    Access: {Full: 'full'},
    state: {access: 'full'},
    flags: {chatDisabled: false},
  }),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/view/com/util/LoadingPlaceholder', () => ({
  LoadingPlaceholder: () => null,
}))
jest.mock('#/view/com/util/PressableWithHover', () => {
  const {Pressable} = require('react-native')
  return {
    PressableWithHover: (props: React.ComponentProps<typeof Pressable>) => (
      <Pressable {...props} />
    ),
  }
})
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
jest.mock('#/view/shell/NavSignupCard', () => ({NavSignupCard: () => null}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} = require('react-native')
  return {
    Button: ({
      children,
      label,
      ...props
    }: React.PropsWithChildren<{label: string}>) => (
      <Pressable accessibilityHint="" accessibilityLabel={label} {...props}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
    ButtonText: ({children}: React.PropsWithChildren) => (
      <Text>{children}</Text>
    ),
  }
})
jest.mock('#/components/Prompt', () => ({
  usePromptControl: () => ({open: jest.fn(), close: jest.fn()}),
  Basic: () => null,
}))
jest.mock('#/components/Dialog', () => {
  const {View} = require('react-native')
  let closeCallback: (() => void) | undefined
  const close = jest.fn((callback?: () => void) => {
    closeCallback = callback
  })

  return {
    __testClose: close,
    __testRunCloseCallback: () => closeCallback?.(),
    Outer: ({children}: React.PropsWithChildren) => <View>{children}</View>,
    Handle: () => null,
    ScrollableInner: ({children}: React.PropsWithChildren) => (
      <View>{children}</View>
    ),
    useDialogControl: () => ({open: jest.fn(), close}),
  }
})
jest.mock('#/alf', () => {
  const atoms = new Proxy(
    {
      scrollbar_offset: {transform: []},
      text_sm: {fontSize: 14},
    },
    {get: (target, key) => target[key as keyof typeof target] ?? {}},
  )
  const themeAtoms = new Proxy({}, {get: () => ({})})
  return {
    atoms,
    tokens: {space: {xl: 16}},
    platform: () => undefined,
    useBreakpoints: () => ({gtMobile: true}),
    useLayoutBreakpoints: () => ({
      leftNavMinimal: false,
      centerColumnOffset: false,
    }),
    useTheme: () => ({
      atoms: themeAtoms,
      palette: {primary_500: 'blue', white: 'white'},
    }),
    web: () => undefined,
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native')
  return {Text}
})
jest.mock('@lingui/react/macro', () => {
  const translate = (
    message: string | {message?: string; values?: Record<string, unknown>},
  ) => {
    if (typeof message === 'string') return message
    return Object.entries(message.values ?? {}).reduce(
      (result, [key, value]) => result.replace(`{${key}}`, String(value)),
      message.message ?? '',
    )
  }
  return {
    Trans: ({children}: React.PropsWithChildren) => children,
    useLingui: () => ({t: translate}),
  }
})
jest.mock('@lingui/react', () => ({
  Trans: ({children}: React.PropsWithChildren) => children,
  useLingui: () => ({
    _: (
      message: string | {message?: string; values?: Record<string, unknown>},
    ) => {
      if (typeof message === 'string') return message
      return Object.entries(message.values ?? {}).reduce(
        (result, [key, value]) => result.replace(`{${key}}`, String(value)),
        message.message ?? '',
      )
    },
  }),
}))
jest.mock('#/components/icons/ArrowBoxLeft', () => ({
  ArrowBoxLeft_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Bell', () => ({
  Bell_Filled_Corner0_Rounded: () => null,
  Bell_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Bookmark', () => ({
  Bookmark: () => null,
  BookmarkFilled: () => null,
}))
jest.mock('#/components/icons/BulletList', () => ({
  BulletList_Filled_Corner0_Rounded: () => null,
  BulletList_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/EditBig', () => ({
  EditBig_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/icons/Hashtag', () => ({
  Hashtag_Filled_Corner0_Rounded: () => null,
  Hashtag_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/HomeOpen', () => ({
  HomeOpen_Filled_Corner0_Rounded: () => null,
  HomeOpen_Stoke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/MagnifyingGlass', () => ({
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded: () => null,
  MagnifyingGlass_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Message', () => ({
  Message_Stroke2_Corner0_Rounded: () => null,
  Message_Stroke2_Corner0_Rounded_Filled: () => null,
}))
jest.mock('#/components/icons/Plus', () => ({
  PlusLarge_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/SettingsGear2', () => ({
  SettingsGear2_Filled_Corner0_Rounded: () => null,
  SettingsGear2_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/UserCircle', () => ({
  UserCircle_Filled_Corner0_Rounded: () => null,
  UserCircle_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/features/liveNow', () => ({
  useActorStatus: () => ({isActive: false}),
}))
jest.mock('../../../../modules/expo-bluesky-swiss-army', () => ({
  PlatformInfo: {getIsReducedMotionEnabled: () => false},
}))

const testDialog = Dialog as typeof Dialog & {
  __testClose: jest.Mock
  __testRunCloseCallback: () => void
}

afterEach(() => {
  jest.clearAllMocks()
  mockPendingDid = null
})

it('renders switch-account rows and defers switching until the menu closes', () => {
  const screen = render(<DesktopLeftNav routeName="Home" />)

  const alphaRow = screen.getByLabelText(/alpha\.profile/)
  const betaRow = screen.getByLabelText(/beta\.example/)
  expect(alphaRow).toBeTruthy()
  expect(betaRow).toBeTruthy()
  expect(StyleSheet.flatten(alphaRow.props.style)).toMatchObject({
    minHeight: 44,
  })
  expect(StyleSheet.flatten(betaRow.props.style)).toMatchObject({
    minHeight: 44,
  })

  fireEvent.press(betaRow)
  expect(mockSwitchAccount).not.toHaveBeenCalled()
  expect(testDialog.__testClose).toHaveBeenCalledTimes(1)

  act(() => testDialog.__testRunCloseCallback())
  expect(mockSwitchAccount).toHaveBeenCalledWith(
    mockAccounts[2],
    'SwitchAccount',
  )

  expect(screen.getByLabelText('Go to profile')).toBeTruthy()
  expect(screen.getByLabelText('Add another account')).toBeTruthy()
  expect(screen.getByLabelText('Sign out')).toBeTruthy()
})

it('disables all switch-account rows while an account switch is pending', () => {
  mockPendingDid = mockAccounts[1].did
  const screen = render(<DesktopLeftNav routeName="Home" />)

  const alphaRow = screen.getByLabelText(/alpha\.profile/)
  const betaRow = screen.getByLabelText(/beta\.example/)

  expect(alphaRow.props.accessibilityState).toMatchObject({disabled: true})
  expect(betaRow.props.accessibilityState).toMatchObject({disabled: true})

  fireEvent.press(alphaRow)
  fireEvent.press(betaRow)

  expect(testDialog.__testClose).not.toHaveBeenCalled()
  expect(mockSwitchAccount).not.toHaveBeenCalled()
})
