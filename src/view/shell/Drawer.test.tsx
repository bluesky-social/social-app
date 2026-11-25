import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import type * as ReactNavigation from '@react-navigation/native'
import {fireEvent, render, renderHook} from '@testing-library/react-native'

import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {buildStateObject} from '#/lib/routes/helpers'
import {type State} from '#/lib/routes/types'
import {DrawerContent} from './Drawer'

const mockDispatch = jest.fn()
const mockSetDrawerOpen = jest.fn()
const mockMetric = jest.fn()
let mockHasSession = true
let mockAtmosphereEnabled = true
let mockNavigationState: State

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<typeof ReactNavigation>('@react-navigation/native'),
  useNavigation: () => ({
    dispatch: mockDispatch,
    getState: () => mockNavigationState,
  }),
  useNavigationState: (selector: (state: State) => unknown) =>
    selector(mockNavigationState),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    hasSession: mockHasSession,
    currentAccount: mockHasSession
      ? {did: 'did:plc:viewer', handle: 'viewer.test'}
      : undefined,
  }),
}))
jest.mock('#/state/shell', () => ({
  useSetDrawerOpen: () => mockSetDrawerOpen,
}))
jest.mock('#/state/events', () => ({emitSoftReset: jest.fn()}))
jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => '',
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileQuery: () => ({data: undefined}),
}))
jest.mock('#/state/queries/moderation-inbox', () => ({
  useModerationInboxUnreadCountQuery: () => ({data: undefined}),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    features: {
      enabled: (feature: string) =>
        feature === 'AtmosphereScreenEnable' && mockAtmosphereEnabled,
      ModerationInboxEnable: 'ModerationInboxEnable',
      AtmosphereScreenEnable: 'AtmosphereScreenEnable',
    },
  }),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {
      font_bold: {fontWeight: '700'},
      pt_xl: {paddingTop: 20},
      gap_sm: {gap: 8},
    },
    {get: (target, key) => Reflect.get(target, key) ?? {}},
  ),
  tokens: {space: {xs: 4, xl: 20}},
  web: () => undefined,
  useTheme: () => ({
    atoms: {text: {color: '#111111'}},
    palette: {primary_500: '#0085ff'},
  }),
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
      accessibilityRole,
      testID,
    }: {
      children:
        | React.ReactNode
        | ((state: {hovered: boolean; pressed: boolean}) => React.ReactNode)
      label: string
      onPress: () => void
      accessibilityRole?: 'tab'
      testID?: string
    }) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole={accessibilityRole}
        onPress={onPress}
        testID={testID}>
        {typeof children === 'function'
          ? children({hovered: false, pressed: false})
          : children}
      </Pressable>
    ),
    ButtonIcon: () => null,
    ButtonText: Text,
  }
})
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Link', () => ({
  InlineLinkText:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: jest.fn()}),
}))
jest.mock('#/components/Divider', () => ({Divider: () => null}))
jest.mock('#/components/OTAChannelNotice', () => ({
  OTAChannelNotice: () => null,
}))
jest.mock('#/components/ProfileBadges', () => ({ProfileBadges: () => null}))
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
jest.mock('#/view/icons/useLogoVariant', () => ({
  useLogoVariant: () => 'default',
}))
jest.mock('#/view/shell/NavSignupCard', () => ({NavSignupCard: () => null}))
jest.mock('#/features/inviteFriends', () => ({
  InviteFriendsDialog: () => null,
}))
jest.mock('#/features/liveNow', () => ({
  useActorStatus: () => ({isActive: false}),
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

beforeEach(() => {
  jest.clearAllMocks()
  mockHasSession = true
  mockAtmosphereEnabled = true
  mockNavigationState = buildStateObject('SearchTab', 'Search', {})
})

function renderDrawer() {
  return render(
    <I18nProvider i18n={i18n}>
      <DrawerContent />
    </I18nProvider>,
  )
}

describe('Atmosphere drawer navigation', () => {
  it('opens Atmosphere and closes the drawer from its labeled entry', () => {
    const screen = renderDrawer()

    fireEvent.press(screen.getByRole('tab', {name: 'Atmosphere, Beta'}))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE',
        payload: expect.objectContaining({name: 'AtmosphereTab'}),
      }),
    )
    expect(mockSetDrawerOpen).toHaveBeenCalledWith(false)
    expect(mockMetric).toHaveBeenCalledWith('nav:click', {
      item: 'atmosphere',
      surface: 'drawer',
    })
    expect(screen.queryByRole('tab', {name: 'Activity'})).toBeNull()
  })

  it('highlights Atmosphere when its native tab is active', () => {
    mockNavigationState = buildStateObject('AtmosphereTab', 'Atmosphere', {})

    const {result} = renderHook(() => useNavigationTabState())
    expect(result.current.isAtAtmosphere).toBe(true)
    expect(result.current.isAtHome).toBe(false)

    const screen = renderDrawer()
    expect(screen.getByText('Atmosphere')).toHaveStyle({fontWeight: '700'})
  })

  it('hides the entry when the feature gate is off', () => {
    mockAtmosphereEnabled = false
    const screen = renderDrawer()

    expect(screen.queryByRole('tab', {name: 'Atmosphere, Beta'})).toBeNull()
  })

  it('does not show the authenticated destination when signed out', () => {
    mockHasSession = false
    const screen = renderDrawer()

    expect(screen.queryByRole('tab', {name: 'Atmosphere, Beta'})).toBeNull()
  })
})
