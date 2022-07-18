import React, {useEffect} from 'react'
import {Text, Linking} from 'react-native'
import {
  NavigationContainer,
  LinkingOptions,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {observer} from 'mobx-react-lite'
import type {RootTabsParamList} from './types'
import {useStores} from '../../state'
import * as platform from '../../platform/detection'
import {Home} from '../screens/Home'
import {Search} from '../screens/Search'
import {Notifications} from '../screens/Notifications'
import {Menu} from '../screens/Menu'
import {Profile} from '../screens/Profile'
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
      Home: '',
      Profile: 'profile/:name',
      Search: 'search',
      Notifications: 'notifications',
      Menu: 'menu',
      Login: 'login',
      Signup: 'signup',
      NotFound: '*',
    },
  },
}

export const RootTabs = createBottomTabNavigator()
export const PrimaryStack = createNativeStackNavigator()

const tabBarScreenOptions = ({
  route,
}: {
  route: RouteProp<ParamListBase, string>
}) => ({
  headerShown: false,
  tabBarIcon: (_state: {focused: boolean; color: string; size: number}) => {
    // TODO: icons
    return <Text>{route.name?.[0] || ''}</Text>
  },
})

const HIDE_TAB = {tabBarButton: () => null}

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
        initialRouteName={store.session.isAuthed ? 'Home' : 'Login'}
        screenOptions={tabBarScreenOptions}
        tabBar={tabBar}>
        {store.session.isAuthed ? (
          <>
            <RootTabs.Screen name="Home" component={Home} />
            <RootTabs.Screen name="Search" component={Search} />
            <RootTabs.Screen name="Notifications" component={Notifications} />
            <RootTabs.Screen name="Menu" component={Menu} />
            <RootTabs.Screen
              name="Profile"
              component={Profile}
              options={HIDE_TAB}
            />
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
