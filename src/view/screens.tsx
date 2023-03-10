import * as React from 'react'
import {View, Text, Button} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import {createDrawerNavigator} from '@react-navigation/drawer'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {NavigationState, PartialState} from '@react-navigation/native'

type CommonNavigatorParams = {
  Settings: undefined
  Profile: {name: string}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  PostThread: {name: string; rkey: string}
  PostUpvotedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  Debug: undefined
  Log: undefined
}
type HomeStackNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}
type NotificationsStackNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}
type SearchStackNavigatorParams = CommonNavigatorParams & {
  Search: undefined
}
type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>

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
  Search: r('/search'),
  Notifications: r('/notifications'),
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
    let container = 'HomeStack'
    if (match === 'Notifications') {
      container = 'NotificationsStack'
    } else if (match === 'Search') {
      container = 'SearchStack'
    }
    return {
      routes: [
        {
          name: container,
          state: {
            routes: [{name: match, params}],
          },
        },
      ],
    }
  },
}

function HomeScreen({
  navigation,
}: NativeStackScreenProps<HomeStackNavigatorParams, 'Home'>) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Post"
        onPress={() =>
          navigation.push('PostThread', {name: 'bob', rkey: '123'})
        }
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile', {name: 'alice'})}
      />
    </View>
  )
}

function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<NotificationsStackNavigatorParams, 'Notifications'>) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Notifications Screen</Text>
      <Button
        title="Go to Post"
        onPress={() =>
          navigation.push('PostThread', {name: 'bob', rkey: '123'})
        }
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile', {name: 'alice'})}
      />
    </View>
  )
}

function SearchScreen({
  navigation,
}: NativeStackScreenProps<SearchStackNavigatorParams, 'Search'>) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Search Screen</Text>
      <Button
        title="Go to Post"
        onPress={() =>
          navigation.push('PostThread', {name: 'bob', rkey: '123'})
        }
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile', {name: 'alice'})}
      />
    </View>
  )
}

function SettingsScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Settings'
>) {
  return (
    <View>
      <Text>SettingsScreen</Text>
    </View>
  )
}

function ProfileScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Profile'>) {
  return (
    <View>
      <Text>ProfileScreen {route.params.name}</Text>
    </View>
  )
}

function ProfileFollowersScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>) {
  return (
    <View>
      <Text>ProfileFollowersScreen {route.params.name}</Text>
    </View>
  )
}

function ProfileFollowsScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>) {
  return (
    <View>
      <Text>ProfileFollowsScreen {route.params.name}</Text>
    </View>
  )
}

function PostThreadScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>) {
  return (
    <View>
      <Text>
        PostThreadScreen {route.params.name} {route.params.rkey}
      </Text>
    </View>
  )
}

function PostUpvotedByScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'PostUpvotedBy'>) {
  return (
    <View>
      <Text>
        PostUpvotedByScreen {route.params.name} {route.params.rkey}
      </Text>
    </View>
  )
}

function PostRepostedByScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'PostRepostedBy'>) {
  return (
    <View>
      <Text>
        PostRepostedByScreen {route.params.name} {route.params.rkey}
      </Text>
    </View>
  )
}

function DebugScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Debug'
>) {
  return (
    <View>
      <Text>DebugScreen</Text>
    </View>
  )
}

function LogScreen({}: NativeStackScreenProps<CommonNavigatorParams, 'Log'>) {
  return (
    <View>
      <Text>LogScreen</Text>
    </View>
  )
}

function DrawerContent() {
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
      screenOptions={{swipeEdgeWidth: 300}}>
      <HomeDrawer.Screen name="HomeInner" component={HomeScreen} />
    </HomeDrawer.Navigator>
  )
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
      <HomeStack.Screen name="Home" component={HomeDrawerNavigator} />
      {commonScreens(HomeStack)}
    </HomeStack.Navigator>
  )
}

function NotificationsDrawerNavigator() {
  return (
    <NotificationsDrawer.Navigator
      drawerContent={DrawerContent}
      screenOptions={{swipeEdgeWidth: 300}}>
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
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
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
      screenOptions={{swipeEdgeWidth: 300}}>
      <SearchDrawer.Screen name="SearchInner" component={SearchScreen} />
    </SearchDrawer.Navigator>
  )
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
      <SearchStack.Screen name="Search" component={SearchDrawerNavigator} />
      {commonScreens(SearchStack)}
    </SearchStack.Navigator>
  )
}

function TabsNavigator() {
  return (
    <React.Fragment>
      <Tab.Navigator initialRouteName="HomeStack" backBehavior="initialRoute">
        <Tab.Screen name="HomeStack" component={HomeStackNavigator} />
        <Tab.Screen
          name="NotificationsStack"
          component={NotificationsStackNavigator}
        />
        <Tab.Screen name="SearchStack" component={SearchStackNavigator} />
      </Tab.Navigator>
    </React.Fragment>
  )
}

export function Screens() {
  return (
    <NavigationContainer linking={LINKING}>
      <TabsNavigator />
    </NavigationContainer>
  )
}
