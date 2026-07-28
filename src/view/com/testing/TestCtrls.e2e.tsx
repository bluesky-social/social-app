import {useEffect, useState} from 'react'
import {LogBox, Pressable, View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'

import {BLUESKY_PROXY_HEADER, DEV_ENV_APPVIEW_DID} from '#/lib/constants'
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

const BTN = {height: 16, width: 16}

/*
 * This component is mounted inside <Fragment key={currentAccount?.did}> in
 * App.tsx, so it fully remounts whenever the account changes (sign-in /
 * sign-out). If the "proxy configured" flag lived only in React state it would
 * reset to false on every remount, hiding the sign-in buttons. Keeping it at
 * module level lets it survive remounts so the sign-in buttons stay visible
 * across sign-out during multi-account flows. Module state still resets when
 * the app relaunches with cleared state at the start of each flow, which is the
 * desired gating behavior.
 */
let hasConfiguredProxy = false

export function TestCtrls() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {logoutEveryAccount, login} = useSessionApi()
  const onboardingDispatch = useOnboardingDispatch()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const [isProxyConfigured, setIsProxyConfigured] = useState(hasConfiguredProxy)
  useEffect(() => {
    const header = `${DEV_ENV_APPVIEW_DID}#bsky_appview`
    BLUESKY_PROXY_HEADER.set(header)
    agent.configureProxy(header as any)
    hasConfiguredProxy = true
    setIsProxyConfigured(true)
  }, [agent])
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
  return (
    <View style={{position: 'absolute', top: 100, right: 8, zIndex: 100}}>
      {isProxyConfigured && (
        <>
          <Pressable
            testID="e2eSignInAlice"
            onPress={onPressSignInAlice}
            accessibilityRole="button"
            style={BTN}
          />
          <Pressable
            testID="e2eSignInBob"
            onPress={onPressSignInBob}
            accessibilityRole="button"
            style={BTN}
          />
        </>
      )}
      <Pressable
        testID="e2eSignOut"
        onPress={() => logoutEveryAccount('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoHome"
        onPress={() => navigate('Home')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoSettings"
        onPress={() => navigate('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoModeration"
        onPress={() => navigate('Moderation')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoLists"
        onPress={() => navigate('Lists')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoFeeds"
        onPress={() => navigate('Feeds')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="storybookBtn"
        onPress={() => navigate('Debug')}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eRefreshHome"
        onPress={() => queryClient.invalidateQueries({queryKey: ['post-feed']})}
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
