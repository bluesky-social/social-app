import * as React from 'react'
import {View, Text} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createDrawerNavigator} from '@react-navigation/drawer'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {
  HomeStackNavigatorParams,
  NotificationsStackNavigatorParams,
  SearchStackNavigatorParams,
  State,
} from 'lib/routes/types'

import {BottomBar} from './shell/BottomBar'

import {HomeScreen} from './screens/Home'
import {SearchScreen} from './screens/Search'
import {NotificationsScreen} from './screens/Notifications'
import {SettingsScreen} from './screens/Settings'
import {ProfileScreen} from './screens/Profile'
import {ProfileFollowersScreen} from './screens/ProfileFollowers'
import {ProfileFollowsScreen} from './screens/ProfileFollows'
import {PostThreadScreen} from './screens/PostThread'
import {PostUpvotedByScreen} from './screens/PostUpvotedBy'
import {PostRepostedByScreen} from './screens/PostRepostedBy'
import {DebugScreen} from './screens/Debug'
import {LogScreen} from './screens/Log'

const HomeDrawer = createDrawerNavigator()
const HomeStack = createNativeStackNavigator<HomeStackNavigatorParams>()
const SearchDrawer = createDrawerNavigator()
const SearchStack = createNativeStackNavigator<SearchStackNavigatorParams>()
const NotificationsDrawer = createDrawerNavigator()
const NotificationsStack =
  createNativeStackNavigator<NotificationsStackNavigatorParams>()
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
        return {params: res.groups}
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

const LINKING = {
  prefixes: ['bsky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    let node = state.routes[state.index]
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
    // match the route
    let match = 'Home' // TODO should be not found
    let params: RouteParams = {}
    for (const [name, matcher] of Object.entries(ROUTES)) {
      const res = matcher.match(path)
      if (res) {
        match = name
        params = res.params
        break
      }
    }

    // build the state object
    if (match === 'Search') {
      return buildStateObject('SearchStack', 'Search', params)
    }
    if (match === 'Notifications') {
      return buildStateObject('NotificationsStack', 'Notifications', params)
    }
    return buildStateObject('HomeStack', match, params)
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

function DrawerContent() {
  // TODO
  return (
    <View>
      <Text>Drawer</Text>
    </View>
  )
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
  return (
    <HomeDrawer.Navigator
      drawerContent={DrawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <HomeDrawer.Screen name="HomeInner" component={HomeScreen} />
    </HomeDrawer.Navigator>
  )
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <HomeStack.Screen name="Home" component={HomeDrawerNavigator} />
      {commonScreens(HomeStack)}
    </HomeStack.Navigator>
  )
}

function NotificationsDrawerNavigator() {
  return (
    <NotificationsDrawer.Navigator
      drawerContent={DrawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <NotificationsDrawer.Screen
        name="NotificationsInner"
        component={NotificationsScreen}
      />
    </NotificationsDrawer.Navigator>
  )
}

function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsDrawerNavigator}
      />
      {commonScreens(NotificationsStack)}
    </NotificationsStack.Navigator>
  )
}

function SearchDrawerNavigator() {
  return (
    <SearchDrawer.Navigator
      drawerContent={DrawerContent}
      screenOptions={{swipeEdgeWidth: 300, headerShown: false}}>
      <SearchDrawer.Screen name="SearchInner" component={SearchScreen} />
    </SearchDrawer.Navigator>
  )
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
      }}>
      <SearchStack.Screen name="Search" component={SearchDrawerNavigator} />
      {commonScreens(SearchStack)}
    </SearchStack.Navigator>
  )
}

function TabsNavigator() {
  const tabBar = React.useCallback(props => <BottomBar {...props} />, [])
  return (
    <Tab.Navigator
      initialRouteName="HomeStack"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false}}
      tabBar={tabBar}>
      <Tab.Screen name="HomeStack" component={HomeStackNavigator} />
      <Tab.Screen
        name="NotificationsStack"
        component={NotificationsStackNavigator}
      />
      <Tab.Screen name="SearchStack" component={SearchStackNavigator} />
    </Tab.Navigator>
  )
}

export function Screens() {
  return (
    <NavigationContainer linking={LINKING}>
      <TabsNavigator />
    </NavigationContainer>
  )
}
