import React, {useEffect} from 'react'
import {Linking, Text} from 'react-native'
import {NavigationContainer, LinkingOptions} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {observer} from 'mobx-react-lite'
import type {ScreensParamList} from './types'
import {useStores} from '../../state'
import {Home} from '../screens/Home'
import {Search} from '../screens/Search'
import {Notifications} from '../screens/Notifications'
import {Login} from '../screens/Login'
import {Signup} from '../screens/Signup'
import {NotFound} from '../screens/NotFound'
import {Composer} from '../screens/Composer'
import {PostThread} from '../screens/PostThread'
import {PostLikedBy} from '../screens/PostLikedBy'
import {PostRepostedBy} from '../screens/PostRepostedBy'
import {Profile} from '../screens/Profile'
import {ProfileFollowers} from '../screens/ProfileFollowers'
import {ProfileFollows} from '../screens/ProfileFollows'

const linking: LinkingOptions<ScreensParamList> = {
  prefixes: [
    'http://localhost:3000', // local dev
    'https://pubsq.pfrazee.com', // test server (universal links only)
    'pubsqapp://', // custom protocol (ios)
    'pubsq://app', // custom protocol (android)
  ],
  config: {
    screens: {
      Home: '',
      Search: 'search',
      Notifications: 'notifications',
      Profile: 'profile/:name',
      ProfileFollowers: 'profile/:name/followers',
      ProfileFollows: 'profile/:name/follows',
      PostThread: 'profile/:name/post/:recordKey',
      PostLikedBy: 'profile/:name/post/:recordKey/liked-by',
      PostRepostedBy: 'profile/:name/post/:recordKey/reposted-by',
      Composer: 'compose',
      Login: 'login',
      Signup: 'signup',
      NotFound: '*',
    },
  },
}

export const ScreenStack = createNativeStackNavigator<ScreensParamList>()

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

  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <ScreenStack.Navigator
        initialRouteName={store.session.isAuthed ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}>
        <ScreenStack.Screen name="Home" component={Home} />
        <ScreenStack.Screen name="Search" component={Search} />
        <ScreenStack.Screen name="Notifications" component={Notifications} />
        <ScreenStack.Screen name="Composer" component={Composer} />
        <ScreenStack.Screen name="Profile" component={Profile} />
        <ScreenStack.Screen
          name="ProfileFollowers"
          component={ProfileFollowers}
        />
        <ScreenStack.Screen name="ProfileFollows" component={ProfileFollows} />
        <ScreenStack.Screen name="PostThread" component={PostThread} />
        <ScreenStack.Screen name="PostLikedBy" component={PostLikedBy} />
        <ScreenStack.Screen name="PostRepostedBy" component={PostRepostedBy} />
        <ScreenStack.Screen name="NotFound" component={NotFound} />
        <ScreenStack.Screen name="Login" component={Login} />
        <ScreenStack.Screen name="Signup" component={Signup} />
      </ScreenStack.Navigator>
    </NavigationContainer>
  )
})
