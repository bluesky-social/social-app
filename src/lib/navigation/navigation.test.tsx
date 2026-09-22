import {Text} from 'react-native'
import {router, Stack as RootStack, Tabs} from 'expo-router'
import {act, renderRouter, screen, waitFor} from 'expo-router/testing-library'

import {
  navigate,
  reset,
  resetToTab,
  useAppNavigationRef,
  useNavigation,
  useRoute,
} from '#/lib/navigation'
import {nativeIntentPath} from '#/lib/navigation/nativeIntent'
import {routeConfig} from '#/lib/navigation/routeConfig'
import {getScreenParams, screenHref} from '#/lib/navigation/routes'
import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {type NavigationProp} from '#/lib/routes/types'
import AppStack, {
  unstable_settings as stackSettings,
} from '#/app/(tabs)/(home,search,messages,notifications,profile)/_layout'
import {router as appLinks} from '#/routes'

jest.mock('expo-glass-effect', () => ({isLiquidGlassAvailable: () => false}))
jest.mock('@expo/ui/jetpack-compose', () => ({}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    i18n: {_: ({message, id}: {message?: string; id: string}) => message ?? id},
  }),
}))
jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => 0,
}))
jest.mock('#/view/shell', () => ({
  DrawerLayout: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('#/lib/hooks/useWebMediaQueries', () => ({
  useWebMediaQueries: () => ({isMobile: true}),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: mockHasSession}),
}))
jest.mock('#/state/shell', () => ({
  useOnboardingState: () => ({isActive: false}),
}))
jest.mock('#/state/shell/logged-out', () => ({
  useLoggedOutView: () => ({showLoggedOut: false}),
  useLoggedOutViewControls: () => ({setShowLoggedOut: jest.fn()}),
}))
jest.mock('#/alf', () => ({
  atoms: {flex_1: {flex: 1}},
  useTheme: () => ({atoms: {bg: {}}}),
  useLayoutBreakpoints: () => ({leftNavMinimal: true}),
}))
jest.mock('#/components/PolicyUpdateOverlay', () => ({
  PolicyUpdateOverlay: () => null,
}))
jest.mock('#/view/shell/bottom-bar/BottomBarWeb', () => ({
  BottomBarWeb: () => null,
}))
jest.mock('#/view/shell/desktop/LeftNav', () => ({DesktopLeftNav: () => null}))
jest.mock('#/view/shell/desktop/RightNav', () => ({
  DesktopRightNav: () => null,
}))
jest.mock('#/screens/Onboarding', () => ({Onboarding: () => null}))
jest.mock('#/screens/SignupQueued', () => ({SignupQueued: () => null}))
jest.mock('#/view/com/auth/LoggedOut', () => ({LoggedOut: () => null}))

let mockHasSession = true
beforeEach(() => {
  mockHasSession = true
})

let navigation: NavigationProp
let app: ReturnType<typeof renderRouter>

async function step(callback: () => unknown) {
  try {
    await act(async () => {
      await callback()
    })
  } catch (error) {
    if (error instanceof AggregateError)
      throw new Error(
        error.errors
          .map((e: unknown) => (e instanceof Error ? e.stack : String(e)))
          .join('\n'),
      )
    throw error
  }
}

function Root() {
  useAppNavigationRef()
  return <RootStack screenOptions={{headerShown: false, animation: 'none'}} />
}

function Probe() {
  navigation = useNavigation()
  const route = useRoute()
  return (
    <Text testID="route">
      {JSON.stringify({name: route.name, params: route.params})}
    </Text>
  )
}

const group = '(tabs)/(home,search,messages,notifications,profile)'
const context = {
  _layout: Root,
  '(tabs)/_layout': {
    default: () => (
      <Tabs screenOptions={{headerShown: false}} tabBar={() => null} />
    ),
    unstable_settings: {initialRouteName: '(home)'},
  },
  [`${group}/_layout`]: {
    default: AppStack,
    unstable_settings: stackSettings,
  },
  ...Object.fromEntries(
    Object.keys(routeConfig).map(file => [`${group}/${file}`, Probe]),
  ),
}

describe('Expo Router navigation', () => {
  it('keeps native screens behind the existing authentication gate', () => {
    mockHasSession = false
    renderRouter(context, {initialUrl: '/profile/alice.test'})
    expect(screen.queryByTestId('route')).toBeNull()
  })
  it('opens a cold profile link with a Home back destination', async () => {
    app = renderRouter(context, {
      initialUrl: nativeIntentPath('bluesky://profile/alice.test'),
    })
    expect(screen.getByTestId('route').props.children).toContain(
      '"name":"Profile"',
    )
    expect(screen.getByTestId('route').props.children).toContain('alice.test')
    expect(router.canGoBack()).toBe(true)
    await step(() => router.back())
    await waitFor(() => expect(app.getPathname()).toBe('/'))
  })

  it('preserves independent native tab histories', async () => {
    app = renderRouter(context)
    await step(() => navigation.push('Profile', {name: 'alice.test'}))
    await waitFor(() => expect(app.getPathname()).toBe('/profile/alice.test'))
    await step(() => {
      void navigate('SearchTab')
    })
    await waitFor(() => expect(app.getPathname()).toBe('/search'))
    await step(() => navigation.push('Profile', {name: 'bob.test'}))
    await waitFor(() => expect(app.getPathname()).toBe('/profile/bob.test'))
    await step(() => {
      void navigate('HomeTab')
    })
    await waitFor(() => expect(app.getPathname()).toBe('/profile/alice.test'))
    await step(() => {
      void navigate('SearchTab')
    })
    await waitFor(() => expect(app.getPathname()).toBe('/profile/bob.test'))
    await step(() => resetToTab('SearchTab'))
    await waitFor(() => expect(app.getPathname()).toBe('/search'))
  })

  it('routes notification conversation parameters to Messages', async () => {
    app = renderRouter(context)
    await step(() => {
      void navigate('MessagesTab', {
        screen: 'Messages',
        params: {pushToConversation: 'convo-1'},
      })
    })
    await waitFor(() => expect(app.getPathname()).toBe('/messages'))
    expect(app.getSearchParams()).toMatchObject({pushToConversation: 'convo-1'})
    await step(() =>
      navigation.navigate('MessagesConversation', {
        conversation: 'convo-1',
        accept: true,
      }),
    )
    await waitFor(() => expect(app.getPathname()).toBe('/messages/convo-1'))
    expect(screen.getByTestId('route').props.children).toContain(
      '"accept":true',
    )
  })

  it('clears navigation history when switching accounts', async () => {
    app = renderRouter(context)
    await step(() => navigation.push('Profile', {name: 'alice.test'}))
    await waitFor(() => expect(app.getPathname()).toBe('/profile/alice.test'))
    await step(() => {
      void reset()
    })
    await waitFor(() => expect(app.getPathname()).toBe('/'))
    expect(router.canGoBack()).toBe(false)
  })
})

describe('URL boundaries', () => {
  it.each(['bluesky', 'bsky'])(
    'preserves the original %s intent URL for the overlay handler',
    scheme => {
      const url = parseLinkingUrl(`${scheme}://intent/compose?text=hello`)
      expect(url.pathname).toBe('/intent/compose')
      expect(url.searchParams.get('text')).toBe('hello')
    },
  )
  it('preserves the current screen for an intent received while the app is open', () => {
    expect(
      nativeIntentPath(
        'bluesky://intent/compose?text=hello',
        '/(tabs)/(search)/search?q=cats',
      ),
    ).toBe('/(tabs)/(search)/search?q=cats')
  })
  it('encodes dynamic link parameters exactly once', async () => {
    const tag = '日本語100%'
    const href = appLinks.matchName('Hashtag')!.build({tag})
    expect(href).toBe(`/hashtag/${encodeURIComponent(tag)}`)
    expect(appLinks.matchPath(href)).toEqual(['Hashtag', {tag}])
    app = renderRouter(context)
    await step(() => navigation.push('Hashtag', {tag}))
    expect(screen.getByTestId('route').props.children).toContain(tag)
    expect(appLinks.matchPath('/hashtag/%broken')[0]).toBe('NotFound')
  })
  it.each([
    [
      'https://bsky.app/profile/alice.test/post/123',
      '/(tabs)/(home)/profile/alice.test/post/123',
    ],
    ['bsky://search?q=cats', '/(tabs)/(search)/search?q=cats'],
    ['bluesky:///notifications', '/(tabs)/(notifications)/notifications'],
    ['exp://localhost:8081/--/messages', '/(tabs)/(messages)/messages'],
    ['bluesky://intent/compose?text=hello', '/(tabs)/(home)'],
    ['https://bsky.app/chat/invite-code', '/(tabs)/(home)'],
  ])('normalizes %s', (url, expected) => {
    expect(nativeIntentPath(url)).toBe(expected)
  })

  it('keeps URL parameters serializable and handles false boolean values', () => {
    expect(
      screenHref('StarterPack', {
        name: 'alice.test',
        rkey: '123',
        new: false,
        unused: undefined,
      }),
    ).toEqual({
      pathname: '/(tabs)/(home)/starter-pack/[name]/[rkey]',
      params: {name: 'alice.test', rkey: '123', new: 'false'},
    })
    expect(
      getScreenParams({new: 'false', fromDialog: 'true', q: 'false'}),
    ).toEqual({new: false, fromDialog: true, q: 'false'})
    expect(() =>
      screenHref('StarterPackWizard', {onSuccess: () => {}}),
    ).toThrow('must be serializable')
  })
})
