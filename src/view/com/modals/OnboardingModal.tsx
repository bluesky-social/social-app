import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {DiscoverFeedsScreen} from 'view/screens/DiscoverFeeds'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import {CustomFeedScreen} from 'view/screens/CustomFeed'
import {Welcome} from '../auth/onboarding/Welcome'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'

export const snapPoints = ['90%']

export type OnboardingNavigatorParams = {
  Welcome: undefined
  DiscoverFeeds: undefined
  CustomFeed: {name: string; rkey: string}
}

const OnboardingStack = createNativeStackNavigator<OnboardingNavigatorParams>()

export function Component() {
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  return (
    <NavigationContainer independent={true} theme={theme}>
      <OnboardingStack.Navigator screenOptions={{headerShown: false}}>
        <OnboardingStack.Screen name="Welcome" component={Welcome} />
        <OnboardingStack.Screen
          name="DiscoverFeeds"
          component={DiscoverFeedsScreen}
        />
        <OnboardingStack.Screen
          name="CustomFeed"
          component={CustomFeedScreen}
        />
      </OnboardingStack.Navigator>
    </NavigationContainer>
  )
}
