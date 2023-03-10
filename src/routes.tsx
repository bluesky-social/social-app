import * as React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createDrawerNavigator} from '@react-navigation/drawer'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {
  HomeTabNavigatorParams,
  NotificationsTabNavigatorParams,
  SearchTabNavigatorParams,
  State,
} from 'lib/routes/types'

import {Drawer} from './view/shell/Drawer'
import {BottomBar} from './view/shell/BottomBar'

import {HomeScreen} from './view/screens/Home'
import {SearchScreen} from './view/screens/Search'
import {NotificationsScreen} from './view/screens/Notifications'
import {SettingsScreen} from './view/screens/Settings'
import {ProfileScreen} from './view/screens/Profile'
import {ProfileFollowersScreen} from './view/screens/ProfileFollowers'
import {ProfileFollowsScreen} from './view/screens/ProfileFollows'
import {PostThreadScreen} from './view/screens/PostThread'
import {PostUpvotedByScreen} from './view/screens/PostUpvotedBy'
import {PostRepostedByScreen} from './view/screens/PostRepostedBy'
import {DebugScreen} from './view/screens/Debug'
import {LogScreen} from './view/screens/Log'

const HomeDrawer = createDrawerNavigator()
const HomeTab = createNativeStackNavigator<HomeTabNavigatorParams>()
const SearchDrawer = createDrawerNavigator()
const SearchTab = createNativeStackNavigator<SearchTabNavigatorParams>()
const NotificationsDrawer = createDrawerNavigator()
const NotificationsTab =
  createNativeStackNavigator<NotificationsTabNavigatorParams>()
const Tab = createBottomTabNavigator()

type RouteParams = Record<string, string>
type MatchResult = {params: RouteParams}
type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params: RouteParams) => string
}
function r(pattern: string): Route {
  let matcherReInternal = pattern.replace(
    /:([\w]+)/g,
    (_m, name) => `(?<${name}>[^/]+)`,
  )
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')
  return {
    match(path: string) {
      const res = matcherRe.exec(path)
      if (res) {
        return {params: res.groups || {}}
      }
      return undefined
    },
    build(params: Record<string, string>) {
      return pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[name] || 'undefined',
      )
    },
  }
}
const ROUTES: Record<string, Route> = {
  Home: r('/'),
  HomeInner: r('/'),
  Search: r('/search'),
  SearchInner: r('/search'),
  Notifications: r('/notifications'),
  NotificationsInner: r('/notifications'),
  Settings: r('/settings'),
  Profile: r('/profile/:name'),
  ProfileFollowers: r('/profile/:name/followers'),
  ProfileFollows: r('/profile/:name/follows'),
  PostThread: r('/profile/:name/post/:rkey'),
  PostUpvotedBy: r('/profile/:name/post/:rkey/upvoted-by'),
  PostRepostedBy: r('/profile/:name/post/:rkey/reposted-by'),
  Debug: r('/sys/debug'),
  Log: r('/sys/log'),
}

export function matchPath(path: string): {name: string; params: RouteParams} {
  let name = 'Home' // TODO should be not found
  let params: RouteParams = {}
  for (const [screenName, matcher] of Object.entries(ROUTES)) {
    const res = matcher.match(path)
    if (res) {
      name = screenName
      params = res.params
      break
    }
  }
  return {name, params}
}

export const LINKING = {
  prefixes: ['bsky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    let node = state.routes[state.index || 0]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }

    // build the path
    const route = ROUTES[node.name]
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(path: string) {
    const {name, params} = matchPath(path)
    if (name === 'Search') {
      return buildStateObject('SearchTab', 'Search', params)
    }
    if (name === 'Notifications') {
      return buildStateObject('NotificationsTab', 'Notifications', params)
    }
    return buildStateObject('HomeTab', name, params)
  },
}

function buildStateObject(stack: string, route: string, params: RouteParams) {
  return {
    routes: [
      {
        name: stack,
        state: {
          routes: [{name: route, params}],
        },
      },
    ],
  }
}

function commonScreens(Stack: ReturnType<typeof createNativeStackNavigator>) {
  return (
    <>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="ProfileFollowers"
        component={ProfileFollowersScreen}
      />
      <Stack.Screen name="ProfileFollows" component={ProfileFollowsScreen} />
      <Stack.Screen name="PostThread" component={PostThreadScreen} />
      <Stack.Screen name="PostUpvotedBy" component={PostUpvotedByScreen} />
      <Stack.Screen name="PostRepostedBy" component={PostRepostedByScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="Log" component={LogScreen} />
    </>
  )
}

function HomeDrawerNavigator() {
  const drawerContent = React.useCallback(props => <Drawer {...props} />, [])
  return (
    <HomeDrawer.Navigator
      drawerContent={drawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <HomeDrawer.Screen name="HomeInner" component={HomeScreen} />
    </HomeDrawer.Navigator>
  )
}

function HomeTabNavigator() {
  return (
    <HomeTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <HomeTab.Screen name="Home" component={HomeDrawerNavigator} />
      {commonScreens(HomeTab)}
    </HomeTab.Navigator>
  )
}

function NotificationsDrawerNavigator() {
  const drawerContent = React.useCallback(props => <Drawer {...props} />, [])
  return (
    <NotificationsDrawer.Navigator
      drawerContent={drawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <NotificationsDrawer.Screen
        name="NotificationsInner"
        component={NotificationsScreen}
      />
    </NotificationsDrawer.Navigator>
  )
}

function NotificationsTabNavigator() {
  return (
    <NotificationsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <NotificationsTab.Screen
        name="Notifications"
        component={NotificationsDrawerNavigator}
      />
      {commonScreens(NotificationsTab)}
    </NotificationsTab.Navigator>
  )
}

function SearchDrawerNavigator() {
  const drawerContent = React.useCallback(props => <Drawer {...props} />, [])
  return (
    <SearchDrawer.Navigator
      drawerContent={drawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <SearchDrawer.Screen name="SearchInner" component={SearchScreen} />
    </SearchDrawer.Navigator>
  )
}

function SearchTabNavigator() {
  return (
    <SearchTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <SearchTab.Screen name="Search" component={SearchDrawerNavigator} />
      {commonScreens(SearchTab)}
    </SearchTab.Navigator>
  )
}

export function TabsNavigator() {
  const tabBar = React.useCallback(props => <BottomBar {...props} />, [])
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false}}
      tabBar={tabBar}>
      <Tab.Screen name="HomeTab" component={HomeTabNavigator} />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsTabNavigator}
      />
      <Tab.Screen name="SearchTab" component={SearchTabNavigator} />
    </Tab.Navigator>
  )
}

export function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  return <NavigationContainer linking={LINKING}>{children}</NavigationContainer>
}
