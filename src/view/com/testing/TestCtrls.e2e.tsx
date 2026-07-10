import {useState} from 'react'
import {LogBox, Pressable, TextInput, View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'

import {BLUESKY_PROXY_HEADER} from '#/lib/constants'
import {useAgent, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useOnboardingDispatch} from '#/state/shell/onboarding'
import {navigate} from '../../../Navigation'

LogBox.ignoreAllLogs()

/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */

const BTN = {height: 1, width: 1, backgroundColor: 'red'}

export function TestCtrls() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {logoutEveryAccount, login} = useSessionApi()
  const onboardingDispatch = useOnboardingDispatch()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const onPressSignInAlice = async () => {
    console.info('[E2E] Signing in as Alice')
    await login(
      {
        service: 'http://localhost:3000',
        identifier: 'alice.test',
        password: 'hunter2',
      },
      'LoginForm',
    )
    setShowLoggedOut(false)
  }
  const onPressSignInBob = async () => {
    console.info('[E2E] Signing in as Bob')
    await login(
      {
        service: 'http://localhost:3000',
        identifier: 'bob.test',
        password: 'hunter2',
      },
      'LoginForm',
    )
    setShowLoggedOut(false)
  }
  const [proxyHeader, setProxyHeader] = useState('')
  return (
    <View style={{position: 'absolute', top: 100, right: 0, zIndex: 100}}>
      <TextInput
        accessibilityLabel="Text input field"
        accessibilityHint="Enter proxy header"
        testID="e2eProxyHeaderInput"
        onChangeText={val => setProxyHeader(val)}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        onSubmitEditing={() => {
          const header = `${proxyHeader}#bsky_appview`
          BLUESKY_PROXY_HEADER.set(header)
          agent.configureProxy(header as any)
        }}
        style={BTN}
      />
      <Pressable
        testID="e2eSignInAlice"
        onPress={() => void onPressSignInAlice()}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eSignInBob"
        onPress={() => void onPressSignInBob()}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eSignOut"
        onPress={() => void logoutEveryAccount('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoHome"
        onPress={() => void navigate('Home')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoSettings"
        onPress={() => void navigate('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoModeration"
        onPress={() => void navigate('Moderation')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoLists"
        onPress={() => void navigate('Lists')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoFeeds"
        onPress={() => void navigate('Feeds')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="storybookBtn"
        onPress={() => void navigate('Debug')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoIos26CrashRegression"
        onPress={() => void navigate('Ios26CrashRegression')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eRefreshHome"
        onPress={() =>
          void queryClient.invalidateQueries({queryKey: ['post-feed']})
        }
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eOpenLoggedOutView"
        onPress={() => setShowLoggedOut(true)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eStartOnboarding"
        onPress={() => {
          onboardingDispatch({type: 'start'})
        }}
        accessibilityRole="button"
        style={BTN}
      />
    </View>
  )
}
