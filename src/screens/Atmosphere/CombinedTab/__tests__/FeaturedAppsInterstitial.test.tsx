import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {AvatarStack} from '#/components/AvatarStack'
import {FeaturedAppsInterstitial} from '../FeaturedAppsInterstitial'

const mockMetric = jest.fn()
const mockGalleryFocus = {focusRef: jest.fn(), tabIndex: 0, onFocus: jest.fn()}
let mockIsPending = false
let mockApps: FeaturedApp[] = []

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('#/screens/Atmosphere/metrics/context', () => ({
  useAtmosphereMetricContext: () => ({tab: 'combined', surface: 'tab'}),
}))
jest.mock('#/screens/Atmosphere/data/useAtmosphereExploreQuery', () => ({
  useAtmosphereExploreQuery: () => ({data: {}, isPending: mockIsPending}),
}))
jest.mock('#/screens/Atmosphere/data/exploreData', () => ({
  getAtmosphereExploreApps: () => mockApps,
}))
jest.mock('#/screens/Atmosphere/metrics/apps', () => ({
  getAppMetric: ({position}: {position: number}) => ({
    position,
    hasSocialProof: false,
  }),
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/AvatarStack', () => ({
  AvatarStack: jest.fn(() => null),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {text_sm: {fontSize: 14}},
    {get: (target, key) => target[key as keyof typeof target] ?? {}},
  ),
  useTheme: () => ({
    atoms: new Proxy({}, {get: () => ({})}),
    palette: {primary_25: '#eef6ff', primary_500: '#0085ff'},
  }),
}))
jest.mock('#/components/Gallery', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Bleed: ({children}: {children: React.ReactNode}) => children,
    Root: ({
      children,
      testID,
    }: {
      children: React.ReactNode
      testID?: string
    }) => <View testID={testID}>{children}</View>,
    Item: ({
      children,
    }: {
      children: (focus: typeof mockGalleryFocus) => React.ReactNode
    }) => children(mockGalleryFocus),
  }
})
jest.mock('#/components/Skeleton', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Block: View, Col: View, Text: View, Row: View, Circle: View}
})
jest.mock('#/components/icons/Arrow', () => ({
  ArrowRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Square', () => ({
  SquareArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Window', () => ({
  Window_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      to,
      label,
      testID,
      onPress,
      onFocus,
      tabIndex,
    }: {
      to: string
      label: string
      testID?: string
      onPress?: () => void
      onFocus?: () => void
      tabIndex?: -1 | 0
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}
        tabIndex={tabIndex}
        onFocus={onFocus}
        onPress={onPress}
      />
    ),
  }
})
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      testID,
      onPress,
    }: {
      children: (state: {hovered: boolean}) => React.ReactNode
      label: string
      testID?: string
      onPress: () => void
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children({hovered: false})}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => children,
    ButtonIcon: () => null,
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})

function renderInterstitial(onPressSeeMore?: () => void) {
  return render(
    <I18nProvider i18n={i18n}>
      <FeaturedAppsInterstitial onPressSeeMore={onPressSeeMore} />
    </I18nProvider>,
  )
}

const app: FeaturedApp = {
  id: 'app',
  title: 'Test app',
  url: 'https://example.com/app',
  backgroundImage: 'https://example.com/bg.jpg',
  profile: {
    did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
    handle: 'app.test',
    followersCount: 42,
    viewer: {
      knownFollowers: {
        count: 1,
        followers: [{did: 'did:plc:follower', handle: 'follower.test'}],
      },
    },
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsPending = false
  mockApps = [app]
})

it.each([false, true])(
  'shows the compact header and opens all apps while pending: %s',
  isPending => {
    mockIsPending = isPending
    const onPressSeeMore = jest.fn()
    renderInterstitial(onPressSeeMore)

    expect(screen.getByRole('header')).toHaveTextContent('Featured apps')
    expect(screen.getByRole('header')).toHaveStyle({fontSize: 14})
    expect(screen.getByTestId('combinedFeaturedApps')).toHaveStyle({
      backgroundColor: '#eef6ff',
    })
    expect(screen.getByText('View all')).toBeTruthy()
    expect(screen.queryByText('See more')).toBeNull()

    fireEvent.press(screen.getByRole('button', {name: 'View all apps'}))

    expect(onPressSeeMore).toHaveBeenCalledTimes(1)
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:section:seeMore', {
      tab: 'combined',
      surface: 'tab',
      section: 'apps',
      destinationTab: 'apps',
    })
  },
)

it('preserves card content, links, focus, and metrics', () => {
  renderInterstitial()

  expect(screen.getByTestId('atmosphereAppsGallery')).toBeTruthy()
  expect(screen.getByText('Test app')).toBeTruthy()
  expect(screen.getByText('42 followers on Bluesky')).toBeTruthy()
  expect(jest.mocked(AvatarStack).mock.lastCall?.[0]).toEqual({
    profiles: app.profile!.viewer!.knownFollowers!.followers,
    size: 18,
  })

  const website = screen.getByRole('link', {name: 'Visit the Test app website'})
  const profile = screen.getByRole('link', {name: 'View Test app profile'})
  expect(website.props.accessibilityValue).toEqual({text: app.url})
  expect(profile.props.accessibilityValue).toEqual({text: '/profile/app.test'})
  expect(website.props.tabIndex).toBe(0)
  expect(profile.props.tabIndex).toBe(0)
  fireEvent(website, 'focus')
  expect(mockGalleryFocus.onFocus).toHaveBeenCalledTimes(1)

  fireEvent.press(website)
  fireEvent.press(profile)
  const context = {
    tab: 'combined',
    surface: 'tab',
    position: 0,
    hasSocialProof: true,
    source: 'featuredCard',
  }
  expect(mockMetric.mock.calls).toEqual([
    ['atmosphere:app:websitePressed', context],
    ['atmosphere:app:profilePressed', context],
  ])
})

it('omits View all without a navigation callback', () => {
  renderInterstitial()

  expect(screen.getByRole('header')).toHaveTextContent('Featured apps')
  expect(screen.queryByRole('button')).toBeNull()
})

it('hides an empty loaded interstitial', () => {
  mockApps = []
  renderInterstitial(jest.fn())

  expect(screen.queryByTestId('combinedFeaturedApps')).toBeNull()
})
