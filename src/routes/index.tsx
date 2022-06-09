import React from 'react'
import {Text} from 'react-native'
import {
  NavigationContainer,
  LinkingOptions,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {observer} from 'mobx-react-lite'
import type {RootStackParamList} from './types'
import {useStores} from '../state'
import {Home} from '../screens/Home'
import {Search} from '../screens/Search'
import {Notifications} from '../screens/Notifications'
import {Menu} from '../screens/Menu'
import {Profile} from '../screens/Profile'
import {Login} from '../screens/Login'
import {Signup} from '../screens/Signup'
import {NotFound} from '../screens/NotFound'

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'http://localhost:3000', // local dev
  ],
  config: {
    screens: {
      Primary: {
        screens: {
          Home: '',
          Search: 'search',
          Notifications: 'notifications',
          Menu: 'menu',
        },
      },
      Login: 'login',
      Signup: 'signup',
      Profile: 'profile/:name',
      NotFound: '*',
    },
  },
}

export const RootStack = createNativeStackNavigator()
export const PrimaryTab = createBottomTabNavigator()

const tabBarScreenOptions = ({
  route,
}: {
  route: RouteProp<ParamListBase, string>
}) => ({
  tabBarIcon: (_state: {focused: boolean; color: string; size: number}) => {
    // TODO: icons
    return <Text>{route.name.at(0)}</Text>
  },
})

function Primary() {
  return (
    <PrimaryTab.Navigator
      screenOptions={tabBarScreenOptions}
      initialRouteName="Home">
      <PrimaryTab.Screen name="Home" component={Home} />
      <PrimaryTab.Screen name="Search" component={Search} />
      <PrimaryTab.Screen name="Notifications" component={Notifications} />
      <PrimaryTab.Screen name="Menu" component={Menu} />
    </PrimaryTab.Navigator>
  )
}

export const Root = observer(() => {
  const store = useStores()
  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <RootStack.Navigator
        initialRouteName={store.session.isAuthed ? 'Primary' : 'Login'}>
        {store.session.isAuthed ? (
          <>
            <RootStack.Screen name="Primary" component={Primary} />
            <RootStack.Screen name="Profile" component={Profile} />
            <RootStack.Screen name="NotFound" component={NotFound} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={Login} />
            <RootStack.Screen name="Signup" component={Signup} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  )
})
