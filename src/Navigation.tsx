import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import {
  NavigationContainer,
  createNavigationContainerRef,
  CommonActions,
  StackActions,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import {
  HomeTabNavigatorParams,
  SearchTabNavigatorParams,
  FeedsTabNavigatorParams,
  NotificationsTabNavigatorParams,
  FlatNavigatorParams,
  AllNavigatorParams,
  MyProfileTabNavigatorParams,
  BottomTabNavigatorParams,
} from 'lib/routes/types'
import {BottomBar} from './view/shell/bottom-bar/BottomBar'
import {buildStateObject} from 'lib/routes/helpers'
import {State, RouteParams} from 'lib/routes/types'
import {colors} from 'lib/styles'
import {isNative} from 'platform/detection'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {router} from './routes'
import {usePalette} from 'lib/hooks/usePalette'
import {bskyTitle} from 'lib/strings/headings'
import {JSX} from 'react/jsx-runtime'
import {timeout} from 'lib/async/timeout'
import {useUnreadNotifications} from './state/queries/notifications/unread'
import {useSession} from './state/session'
import {useModalControls} from './state/modals'
import {
  shouldRequestEmailConfirmation,
  setEmailConfirmationRequested,
} from './state/shell/reminders'
import {init as initAnalytics} from './lib/analytics/analytics'

import {HomeScreen} from './view/screens/Home'
import {SearchScreen} from './view/screens/Search'
import {FeedsScreen} from './view/screens/Feeds'
import {NotificationsScreen} from './view/screens/Notifications'
import {ListsScreen} from './view/screens/Lists'
import {ModerationScreen} from './view/screens/Moderation'
import {ModerationModlistsScreen} from './view/screens/ModerationModlists'
import {NotFoundScreen} from './view/screens/NotFound'
import {SettingsScreen} from './view/screens/Settings'
import {LanguageSettingsScreen} from './view/screens/LanguageSettings'
import {ProfileScreen} from './view/screens/Profile'
import {ProfileFollowersScreen} from './view/screens/ProfileFollowers'
import {ProfileFollowsScreen} from './view/screens/ProfileFollows'
import {ProfileFeedScreen} from './view/screens/ProfileFeed'
import {ProfileFeedLikedByScreen} from './view/screens/ProfileFeedLikedBy'
import {ProfileListScreen} from './view/screens/ProfileList'
import {PostThreadScreen} from './view/screens/PostThread'
import {PostLikedByScreen} from './view/screens/PostLikedBy'
import {PostRepostedByScreen} from './view/screens/PostRepostedBy'
import {DebugScreen} from './view/screens/Debug'
import {LogScreen} from './view/screens/Log'
import {SupportScreen} from './view/screens/Support'
import {PrivacyPolicyScreen} from './view/screens/PrivacyPolicy'
import {TermsOfServiceScreen} from './view/screens/TermsOfService'
import {CommunityGuidelinesScreen} from './view/screens/CommunityGuidelines'
import {CopyrightPolicyScreen} from './view/screens/CopyrightPolicy'
import {AppPasswords} from 'view/screens/AppPasswords'
import {ModerationMutedAccounts} from 'view/screens/ModerationMutedAccounts'
import {ModerationBlockedAccounts} from 'view/screens/ModerationBlockedAccounts'
import {SavedFeeds} from 'view/screens/SavedFeeds'
import {PreferencesHomeFeed} from 'view/screens/PreferencesHomeFeed'
import {PreferencesThreads} from 'view/screens/PreferencesThreads'
import {createNativeStackNavigatorWithAuth} from './view/shell/createNativeStackNavigatorWithAuth'

const navigationRef = createNavigationContainerRef<AllNavigatorParams>()

const HomeTab = createNativeStackNavigatorWithAuth<HomeTabNavigatorParams>()
const SearchTab = createNativeStackNavigatorWithAuth<SearchTabNavigatorParams>()
const FeedsTab = createNativeStackNavigatorWithAuth<FeedsTabNavigatorParams>()
const NotificationsTab =
  createNativeStackNavigatorWithAuth<NotificationsTabNavigatorParams>()
const MyProfileTab =
  createNativeStackNavigatorWithAuth<MyProfileTabNavigatorParams>()
const Flat = createNativeStackNavigatorWithAuth<FlatNavigatorParams>()
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()

/**
 * These "common screens" are reused across stacks.
 */
function commonScreens(Stack: typeof HomeTab, unreadCountLabel?: string) {
  const title = (page: string) => bskyTitle(page, unreadCountLabel)

  return (
    <>
      <Stack.Screen
        name="NotFound"
        getComponent={() => NotFoundScreen}
        options={{title: title('Not Found')}}
      />
      <Stack.Screen
        name="Lists"
        component={ListsScreen}
        options={{title: title('Lists'), requireAuth: true}}
      />
      <Stack.Screen
        name="Moderation"
        getComponent={() => ModerationScreen}
        options={{title: title('Moderation'), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationModlists"
        getComponent={() => ModerationModlistsScreen}
        options={{title: title('Moderation Lists'), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationMutedAccounts"
        getComponent={() => ModerationMutedAccounts}
        options={{title: title('Muted Accounts'), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationBlockedAccounts"
        getComponent={() => ModerationBlockedAccounts}
        options={{title: title('Blocked Accounts'), requireAuth: true}}
      />
      <Stack.Screen
        name="Settings"
        getComponent={() => SettingsScreen}
        options={{title: title('Settings'), requireAuth: true}}
      />
      <Stack.Screen
        name="LanguageSettings"
        getComponent={() => LanguageSettingsScreen}
        options={{title: title('Language Settings'), requireAuth: true}}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => ProfileScreen}
        options={({route}) => ({
          title: title(`@${route.params.name}`),
          animation: 'none',
        })}
      />
      <Stack.Screen
        name="ProfileFollowers"
        getComponent={() => ProfileFollowersScreen}
        options={({route}) => ({
          title: title(`People following @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileFollows"
        getComponent={() => ProfileFollowsScreen}
        options={({route}) => ({
          title: title(`People followed by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileList"
        getComponent={() => ProfileListScreen}
        options={{title: title('List'), requireAuth: true}}
      />
      <Stack.Screen
        name="PostThread"
        getComponent={() => PostThreadScreen}
        options={({route}) => ({title: title(`Post by @${route.params.name}`)})}
      />
      <Stack.Screen
        name="PostLikedBy"
        getComponent={() => PostLikedByScreen}
        options={({route}) => ({title: title(`Post by @${route.params.name}`)})}
      />
      <Stack.Screen
        name="PostRepostedBy"
        getComponent={() => PostRepostedByScreen}
        options={({route}) => ({title: title(`Post by @${route.params.name}`)})}
      />
      <Stack.Screen
        name="ProfileFeed"
        getComponent={() => ProfileFeedScreen}
        options={{title: title('Feed'), requireAuth: true}}
      />
      <Stack.Screen
        name="ProfileFeedLikedBy"
        getComponent={() => ProfileFeedLikedByScreen}
        options={{title: title('Liked by')}}
      />
      <Stack.Screen
        name="Debug"
        getComponent={() => DebugScreen}
        options={{title: title('Debug'), requireAuth: true}}
      />
      <Stack.Screen
        name="Log"
        getComponent={() => LogScreen}
        options={{title: title('Log'), requireAuth: true}}
      />
      <Stack.Screen
        name="Support"
        getComponent={() => SupportScreen}
        options={{title: title('Support')}}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        getComponent={() => PrivacyPolicyScreen}
        options={{title: title('Privacy Policy')}}
      />
      <Stack.Screen
        name="TermsOfService"
        getComponent={() => TermsOfServiceScreen}
        options={{title: title('Terms of Service')}}
      />
      <Stack.Screen
        name="CommunityGuidelines"
        getComponent={() => CommunityGuidelinesScreen}
        options={{title: title('Community Guidelines')}}
      />
      <Stack.Screen
        name="CopyrightPolicy"
        getComponent={() => CopyrightPolicyScreen}
        options={{title: title('Copyright Policy')}}
      />
      <Stack.Screen
        name="AppPasswords"
        getComponent={() => AppPasswords}
        options={{title: title('App Passwords'), requireAuth: true}}
      />
      <Stack.Screen
        name="SavedFeeds"
        getComponent={() => SavedFeeds}
        options={{title: title('Edit My Feeds'), requireAuth: true}}
      />
      <Stack.Screen
        name="PreferencesHomeFeed"
        getComponent={() => PreferencesHomeFeed}
        options={{title: title('Home Feed Preferences'), requireAuth: true}}
      />
      <Stack.Screen
        name="PreferencesThreads"
        getComponent={() => PreferencesThreads}
        options={{title: title('Threads Preferences'), requireAuth: true}}
      />
    </>
  )
}

/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
function TabsNavigator() {
  const tabBar = React.useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <BottomBar {...props} />
    ),
    [],
  )

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={tabBar}>
      <Tab.Screen name="HomeTab" getComponent={() => HomeTabNavigator} />
      <Tab.Screen name="SearchTab" getComponent={() => SearchTabNavigator} />
      <Tab.Screen name="FeedsTab" getComponent={() => FeedsTabNavigator} />
      <Tab.Screen
        name="NotificationsTab"
        getComponent={() => NotificationsTabNavigator}
      />
      <Tab.Screen
        name="MyProfileTab"
        getComponent={() => MyProfileTabNavigator}
      />
    </Tab.Navigator>
  )
}

function HomeTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark)

  return (
    <HomeTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}>
      <HomeTab.Screen name="Home" getComponent={() => HomeScreen} />
      {commonScreens(HomeTab)}
    </HomeTab.Navigator>
  )
}

function SearchTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <SearchTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}>
      <SearchTab.Screen name="Search" getComponent={() => SearchScreen} />
      {commonScreens(SearchTab as typeof HomeTab)}
    </SearchTab.Navigator>
  )
}

function FeedsTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <FeedsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}>
      <FeedsTab.Screen
        name="Feeds"
        getComponent={() => FeedsScreen}
        options={{requireAuth: true}}
      />
      {commonScreens(FeedsTab as typeof HomeTab)}
    </FeedsTab.Navigator>
  )
}

function NotificationsTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <NotificationsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}>
      <NotificationsTab.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{requireAuth: true}}
      />
      {commonScreens(NotificationsTab as typeof HomeTab)}
    </NotificationsTab.Navigator>
  )
}

function MyProfileTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark)
  return (
    <MyProfileTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}>
      <MyProfileTab.Screen
        // @ts-ignore // TODO: fix this broken type in ProfileScreen
        name="MyProfile"
        getComponent={() => ProfileScreen}
        initialParams={{
          name: 'me',
        }}
      />
      {commonScreens(MyProfileTab as typeof HomeTab)}
    </MyProfileTab.Navigator>
  )
}

/**
 * The FlatNavigator is used by Web to represent the routes
 * in a single ("flat") stack.
 */
const FlatNavigator = () => {
  const pal = usePalette('default')
  const numUnread = useUnreadNotifications()

  const title = (page: string) => bskyTitle(page, numUnread)
  return (
    <Flat.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle: [pal.view],
      }}>
      <Flat.Screen
        name="Home"
        getComponent={() => HomeScreen}
        options={{title: title('Home')}}
      />
      <Flat.Screen
        name="Search"
        getComponent={() => SearchScreen}
        options={{title: title('Search')}}
      />
      <Flat.Screen
        name="Feeds"
        getComponent={() => FeedsScreen}
        options={{title: title('Feeds')}}
      />
      <Flat.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{title: title('Notifications'), requireAuth: true}}
      />
      {commonScreens(Flat as typeof HomeTab, numUnread)}
    </Flat.Navigator>
  )
}

/**
 * The RoutesContainer should wrap all components which need access
 * to the navigation context.
 */

const LINKING = {
  prefixes: ['bsky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    let node = state.routes[state.index || 0]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }

    // build the path
    const route = router.matchName(node.name)
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(path: string) {
    const [name, params] = router.matchPath(path)
    if (isNative) {
      if (name === 'Search') {
        return buildStateObject('SearchTab', 'Search', params)
      }
      if (name === 'Notifications') {
        return buildStateObject('NotificationsTab', 'Notifications', params)
      }
      if (name === 'Home') {
        return buildStateObject('HomeTab', 'Home', params)
      }
      // if the path is something else, like a post, profile, or even settings, we need to initialize the home tab as pre-existing state otherwise the back button will not work
      return buildStateObject('HomeTab', name, params, [
        {
          name: 'Home',
          params: {},
        },
      ])
    } else {
      return buildStateObject('Flat', name, params)
    }
  },
}

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  const {currentAccount} = useSession()
  const {openModal} = useModalControls()

  function onReady() {
    initAnalytics(currentAccount)

    if (currentAccount && shouldRequestEmailConfirmation(currentAccount)) {
      openModal({name: 'verify-email', showReminder: true})
      setEmailConfirmationRequested()
    }
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={LINKING}
      theme={theme}
      onReady={() => {
        SplashScreen.hideAsync()
        logModuleInitTime()
        onReady()
      }}>
      {children}
    </NavigationContainer>
  )
}

/**
 * These helpers can be used from outside of the RoutesContainer
 * (eg in the state models).
 */

function navigate<K extends keyof AllNavigatorParams>(
  name: K,
  params?: AllNavigatorParams[K],
) {
  if (navigationRef.isReady()) {
    return Promise.race([
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)

        // @ts-ignore I dont know what would make typescript happy but I have a life -prf
        navigationRef.navigate(name, params)
      }),
      timeout(1e3),
    ])
  }
  return Promise.resolve()
}

function resetToTab(tabName: 'HomeTab' | 'SearchTab' | 'NotificationsTab') {
  if (navigationRef.isReady()) {
    navigate(tabName)
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop()) //we need to check .canGoBack() before calling it
    }
  }
}

// returns a promise that resolves after the state reset is complete
function reset(): Promise<void> {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: isNative ? 'HomeTab' : 'Home'}],
      }),
    )
    return Promise.race([
      timeout(1e3),
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)
      }),
    ])
  } else {
    return Promise.resolve()
  }
}

function handleLink(url: string) {
  let path
  if (url.startsWith('/')) {
    path = url
  } else if (url.startsWith('http')) {
    try {
      path = new URL(url).pathname
    } catch (e) {
      console.error('Invalid url', url, e)
      return
    }
  } else {
    console.error('Invalid url', url)
    return
  }

  const [name, params] = router.matchPath(path)
  if (isNative) {
    if (name === 'Search') {
      resetToTab('SearchTab')
    } else if (name === 'Notifications') {
      resetToTab('NotificationsTab')
    } else {
      resetToTab('HomeTab')
      // @ts-ignore matchPath doesnt give us type-checked output -prf
      navigate(name, params)
    }
  } else {
    // @ts-ignore matchPath doesnt give us type-checked output -prf
    navigate(name, params)
  }
}

const styles = StyleSheet.create({
  bgDark: {
    backgroundColor: colors.black,
  },
  bgLight: {
    backgroundColor: colors.white,
  },
})

let didInit = false
function logModuleInitTime() {
  if (didInit) {
    return
  }
  didInit = true
  const initMs = Math.round(
    // @ts-ignore Emitted by Metro in the bundle prelude
    performance.now() - global.__BUNDLE_START_TIME__,
  )
  console.log(`Time to first paint: ${initMs} ms`)
  if (__DEV__) {
    // This log is noisy, so keep false committed
    const shouldLog = false
    // Relies on our patch to polyfill.js in metro-runtime
    const initLogs = (global as any).__INIT_LOGS__
    if (shouldLog && Array.isArray(initLogs)) {
      console.log(initLogs.join('\n'))
    }
  }
}

export {
  navigate,
  resetToTab,
  reset,
  handleLink,
  TabsNavigator,
  FlatNavigator,
  RoutesContainer,
}
