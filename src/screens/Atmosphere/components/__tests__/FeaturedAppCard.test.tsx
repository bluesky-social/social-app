import {render, screen} from '@testing-library/react-native'

import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {FeaturedAppCard} from '../FeaturedAppCard'

const mockThemeProvider = jest.fn()
let mockThemeName = 'light'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/KnownFollowers', () => ({KnownFollowers: () => null}))
jest.mock('#/components/icons/Square', () => ({
  SquareArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Button', () => ({
  ButtonText: ({children}: {children: React.ReactNode}) => children,
  ButtonIcon: () => null,
}))
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      to,
      label,
      testID,
    }: {
      to: string
      label: string
      testID?: string
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}
      />
    ),
  }
})
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    name: mockThemeName,
    atoms: new Proxy({}, {get: () => ({})}),
  }),
  ThemeProvider: ({
    theme,
    children,
  }: {
    theme: string
    children: React.ReactNode
  }) => {
    mockThemeProvider(theme)
    return children
  },
}))

const app: FeaturedApp = {
  id: 'app',
  title: 'Test app',
  url: 'https://example.com/app',
  backgroundImage: 'https://example.com/bg.jpg',
  profile: {did: 'did:plc:6ayddqghxhciedbaofoxkcbs', handle: 'app.test'},
}

beforeEach(() => {
  jest.clearAllMocks()
  mockThemeName = 'light'
})

describe('FeaturedAppCard', () => {
  it('links Visit app to the app url', () => {
    render(<FeaturedAppCard app={app} />)

    expect(
      screen.getByTestId('featuredAppVisit').props.accessibilityValue,
    ).toEqual({text: app.url})
  })

  it('links View profile to the profile', () => {
    render(<FeaturedAppCard app={app} />)

    expect(
      screen.getByTestId('featuredAppProfile').props.accessibilityValue,
    ).toEqual({text: '/profile/app.test'})
  })

  it('hides View profile without a profile', () => {
    render(<FeaturedAppCard app={{...app, profile: undefined}} />)

    expect(screen.getByTestId('featuredAppVisit')).toBeTruthy()
    expect(screen.queryByTestId('featuredAppProfile')).toBeNull()
  })

  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
    ['dim', 'light'],
  ])('renders a %s theme as %s', (current, inverted) => {
    mockThemeName = current
    render(<FeaturedAppCard app={app} />)

    expect(mockThemeProvider).toHaveBeenCalledWith(inverted)
  })
})
