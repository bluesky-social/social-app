import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render as renderComponent, screen} from '@testing-library/react-native'

import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {ThemeProvider} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {FeaturedAppCard} from '../FeaturedAppCard'

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: jest.fn()}),
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/AvatarStack', () => ({
  AvatarStack: jest.fn(() => null),
}))
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
jest.mock('#/alf', () => {
  const {createContext, useContext} =
    jest.requireActual<typeof import('react')>('react')
  const ThemeContext = createContext<'light' | 'dark' | 'dim'>('light')
  return {
    atoms: new Proxy({}, {get: () => ({})}),
    useTheme: () => {
      const name = useContext(ThemeContext)
      const color = {light: '#111111', dark: '#eeeeee', dim: '#dddddd'}[name]
      return {
        name,
        atoms: new Proxy({}, {get: () => ({color})}),
      }
    },
    ThemeProvider: ({
      theme,
      children,
    }: {
      theme: 'light' | 'dark' | 'dim'
      children: React.ReactNode
    }) => (
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    ),
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})

function render(ui: React.ReactElement) {
  return renderComponent(<I18nProvider i18n={i18n}>{ui}</I18nProvider>)
}

const app: FeaturedApp = {
  id: 'app',
  title: 'Test app',
  description: 'An app description',
  url: 'https://example.com/app',
  backgroundImage: 'https://example.com/bg.jpg',
  profile: {did: 'did:plc:6ayddqghxhciedbaofoxkcbs', handle: 'app.test'},
}

const metric = {position: 0, hasSocialProof: false}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('FeaturedAppCard', () => {
  it.each([
    ['light', '#111111'],
    ['dark', '#eeeeee'],
    ['dim', '#dddddd'],
  ] as const)('uses the current %s theme', (theme, color) => {
    render(
      <ThemeProvider theme={theme}>
        <FeaturedAppCard metric={metric} app={app} />
      </ThemeProvider>,
    )

    expect(screen.getByText(app.description!)).toHaveStyle({color})
  })

  it.each([
    [0, '0 followers on Bluesky'],
    [1, '1 follower on Bluesky'],
    [42, '42 followers on Bluesky'],
  ])('shows the total follower count: %s', (followersCount, label) => {
    render(
      <FeaturedAppCard
        metric={metric}
        app={{
          ...app,
          profile: {
            ...app.profile!,
            followersCount,
            viewer: {knownFollowers: {count: 2, followers: []}},
          },
        }}
      />,
    )

    expect(screen.getByText(label)).toBeTruthy()
    expect(screen.queryByText(/followers you know/)).toBeNull()
    expect(AvatarStack).not.toHaveBeenCalled()
  })

  it.each([42, undefined])(
    'keeps the known-follower facepile with a total count of %s',
    followersCount => {
      const followers = Array.from({length: 4}, (_, index) => ({
        did: `did:plc:follower${index}` as const,
        handle: `follower${index}.test` as const,
      }))
      render(
        <FeaturedAppCard
          metric={metric}
          app={{
            ...app,
            profile: {
              ...app.profile!,
              followersCount,
              viewer: {knownFollowers: {count: 4, followers}},
            },
          }}
        />,
      )

      expect(jest.mocked(AvatarStack).mock.lastCall?.[0]).toEqual({
        profiles: followers.slice(0, 3),
        size: 18,
      })
      if (followersCount != null) {
        expect(screen.getByText('42 followers on Bluesky')).toBeTruthy()
      } else {
        expect(screen.queryByText(/followers? on Bluesky/)).toBeNull()
      }
    },
  )

  it('hides the follower count when it is unavailable', () => {
    render(<FeaturedAppCard metric={metric} app={app} />)

    expect(screen.queryByText(/followers? on Bluesky/)).toBeNull()
  })

  it('links Website to the app url', () => {
    render(<FeaturedAppCard metric={metric} app={app} />)

    expect(
      screen.getByTestId('featuredAppVisit').props.accessibilityValue,
    ).toEqual({text: app.url})
  })

  it('links View profile to the profile', () => {
    render(<FeaturedAppCard metric={metric} app={app} />)

    expect(
      screen.getByTestId('featuredAppProfile').props.accessibilityValue,
    ).toEqual({text: '/profile/app.test'})
  })

  it('hides Website without a url', () => {
    render(<FeaturedAppCard metric={metric} app={{...app, url: undefined}} />)

    expect(screen.queryByTestId('featuredAppVisit')).toBeNull()
    expect(screen.getByTestId('featuredAppProfile')).toBeTruthy()
  })

  it('hides View profile without a profile', () => {
    render(
      <FeaturedAppCard metric={metric} app={{...app, profile: undefined}} />,
    )

    expect(screen.getByTestId('featuredAppVisit')).toBeTruthy()
    expect(screen.queryByTestId('featuredAppProfile')).toBeNull()
  })
})
