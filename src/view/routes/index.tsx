import React, {useEffect} from 'react'
import {Linking, Text} from 'react-native'
import {
  NavigationContainer,
  LinkingOptions,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import type {RootTabsParamList} from './types'
import {useStores} from '../../state'
import * as platform from '../../platform/detection'
import {Home} from '../screens/Home'
import {Search} from '../screens/Search'
import {Notifications} from '../screens/Notifications'
import {Menu} from '../screens/Menu'
import {Profile} from '../screens/content/Profile'
import {PostThread} from '../screens/content/PostThread'
import {Login} from '../screens/Login'
import {Signup} from '../screens/Signup'
import {NotFound} from '../screens/NotFound'

const linking: LinkingOptions<RootTabsParamList> = {
  prefixes: [
    'http://localhost:3000', // local dev
    'https://pubsq.pfrazee.com', // test server (universal links only)
    'pubsqapp://', // custom protocol (ios)
    'pubsq://app', // custom protocol (android)
  ],
  config: {
    screens: {
      HomeTab: '',
      SearchTab: 'search',
      NotificationsTab: 'notifications',
      MenuTab: 'menu',
      Profile: 'profile/:name',
      PostThread: 'profile/:name/post/:recordKey',
      Login: 'login',
      Signup: 'signup',
      NotFound: '*',
    },
  },
}

export const RootTabs = createBottomTabNavigator<RootTabsParamList>()
export const HomeTabStack = createNativeStackNavigator()
export const SearchTabStack = createNativeStackNavigator()
export const NotificationsTabStack = createNativeStackNavigator()

const tabBarScreenOptions = ({
  route,
}: {
  route: RouteProp<ParamListBase, string>
}) => ({
  headerShown: false,
  tabBarShowLabel: false,
  tabBarIcon: (state: {focused: boolean; color: string; size: number}) => {
    switch (route.name) {
      case 'HomeTab':
        return <FontAwesomeIcon icon="house" style={{color: state.color}} />
      case 'SearchTab':
        return (
          <FontAwesomeIcon
            icon="magnifying-glass"
            style={{color: state.color}}
          />
        )
      case 'NotificationsTab':
        return <FontAwesomeIcon icon="bell" style={{color: state.color}} />
      case 'MenuTab':
        return <FontAwesomeIcon icon="bars" style={{color: state.color}} />
      default:
        return <FontAwesomeIcon icon="bars" style={{color: state.color}} />
    }
  },
})

const HIDE_HEADER = {headerShown: false}
const HIDE_TAB = {tabBarButton: () => null}

function HomeStackCom() {
  return (
    <HomeTabStack.Navigator>
      <HomeTabStack.Screen name="Home" component={Home} options={HIDE_HEADER} />
      <HomeTabStack.Screen name="Profile" component={Profile} />
      <HomeTabStack.Screen name="PostThread" component={PostThread} />
    </HomeTabStack.Navigator>
  )
}

function SearchStackCom() {
  return (
    <SearchTabStack.Navigator>
      <SearchTabStack.Screen
        name="Search"
        component={Search}
        options={HIDE_HEADER}
      />
      <SearchTabStack.Screen name="Profile" component={Profile} />
      <SearchTabStack.Screen name="PostThread" component={PostThread} />
    </SearchTabStack.Navigator>
  )
}

function NotificationsStackCom() {
  return (
    <NotificationsTabStack.Navigator>
      <NotificationsTabStack.Screen
        name="Notifications"
        component={Notifications}
      />
      <NotificationsTabStack.Screen name="Profile" component={Profile} />
      <NotificationsTabStack.Screen name="PostThread" component={PostThread} />
    </NotificationsTabStack.Navigator>
  )
}

export const Root = observer(() => {
  const store = useStores()

  useEffect(() => {
    console.log('Initial link setup')
    Linking.getInitialURL().then((url: string | null) => {
      console.log('Initial url', url)
    })
    Linking.addEventListener('url', ({url}) => {
      console.log('Deep link opened with', url)
    })
  }, [])

  // hide the tabbar on desktop web
  const tabBar = platform.isDesktopWeb ? () => null : undefined

  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <RootTabs.Navigator
        initialRouteName={store.session.isAuthed ? 'HomeTab' : 'Login'}
        screenOptions={tabBarScreenOptions}
        tabBar={tabBar}>
        {store.session.isAuthed ? (
          <>
            <RootTabs.Screen name="HomeTab" component={HomeStackCom} />
            <RootTabs.Screen name="SearchTab" component={SearchStackCom} />
            <RootTabs.Screen
              name="NotificationsTab"
              component={NotificationsStackCom}
            />
            <RootTabs.Screen name="MenuTab" component={Menu} />
          </>
        ) : (
          <>
            <RootTabs.Screen name="Login" component={Login} />
            <RootTabs.Screen name="Signup" component={Signup} />
          </>
        )}
        <RootTabs.Screen
          name="NotFound"
          component={NotFound}
          options={HIDE_TAB}
        />
      </RootTabs.Navigator>
    </NavigationContainer>
  )
})
