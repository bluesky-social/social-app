import * as React from 'react'
import {View, Text, Button} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createDrawerNavigator} from '@react-navigation/drawer'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {
  getStateFromPath,
  NavigationState,
  PartialState,
} from '@react-navigation/native'

type StackNavigatorParamlist = {
  FeedList: undefined
  Details: {
    id: number
    name: string
    handle: string
    date: string
    content: string
    image: string
    avatar: string
    comments: number
    retweets: number
    hearts: number
  }
}
type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>

const PATHS = {
  Home: '/',
  Notifications: '/notifications',
  Search: '/search',
  Details: '/details',
  Profile: '/profile',
}

const LINKING = {
  prefixes: ['bsky://', 'https://bsky.app'],
  getPathFromState(state: State, options?: any) {
    // TODO add parameterization
    let node = state.routes[state.index]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }
    return PATHS[node.name] || '/'
  },
  getStateFromPath(path: string, options?: any) {
    // TODO add parameterization
    let match = 'Home' // TODO should be not found
    for (const [name, matcher] of Object.entries(PATHS)) {
      if (path === matcher) {
        match = name
        break
      }
    }
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
            routes: [{name: match}],
          },
        },
      ],
    }
  },
}

const Drawer = createDrawerNavigator()
const HomeStack = createNativeStackNavigator<StackNavigatorParamlist>()
const NotificationsStack = createNativeStackNavigator<StackNavigatorParamlist>()
const SearchStack = createNativeStackNavigator<StackNavigatorParamlist>()
const Tab = createBottomTabNavigator()

function HomeScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.push('Details')}
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile')}
      />
    </View>
  )
}

function NotificationsScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Notifications Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.push('Details')}
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile')}
      />
    </View>
  )
}

function SearchScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Search Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.push('Details')}
      />
      <Button
        title="Go to profile"
        onPress={() => navigation.push('Profile')}
      />
    </View>
  )
}

function DetailsScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Details Screen</Text>
      <Button
        title="Go to Details... again"
        onPress={() => navigation.push('Details')}
      />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
      <Button
        title="Go back to first screen in stack"
        onPress={() => navigation.popToTop()}
      />
    </View>
  )
}

function ProfileScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Profile Screen</Text>
      <Button
        title="Go to Details... again"
        onPress={() => navigation.push('Details')}
      />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
      <Button
        title="Go back to first screen in stack"
        onPress={() => navigation.popToTop()}
      />
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
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </>
  )
}

function HomeDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={DrawerContent}
      screenOptions={{swipeEdgeWidth: 300}}>
      <Drawer.Screen name="HomeInner" component={HomeScreen} />
    </Drawer.Navigator>
  )
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
      <HomeStack.Screen name="Home" component={HomeDrawer} />
      {commonScreens(HomeStack)}
    </HomeStack.Navigator>
  )
}

function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      {commonScreens(NotificationsStack)}
    </NotificationsStack.Navigator>
  )
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{gestureEnabled: true, fullScreenGestureEnabled: true}}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
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

/*function TabsNavigator() {
  return (
    <React.Fragment>
      <Tab.Navigator initialRouteName="Feed" backBehavior="initialRoute">
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Notifications" component={NotificationsScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
      </Tab.Navigator>
    </React.Fragment>
  )
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={DrawerContent}>
      <Drawer.Screen name="Root" component={TabsNavigator} />
    </Drawer.Navigator>
  )
}

function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="FeedList">
      <Stack.Screen name="FeedList" component={DrawerNavigator} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{headerTitle: 'Tweet'}}
      />
    </Stack.Navigator>
  )
}

export function Screens() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  )
}
*/
