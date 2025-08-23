import {LogBox, Pressable, View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'

import {useModalControls} from '#/state/modals'
import {useSessionApi} from '#/state/session'
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
  const queryClient = useQueryClient()
  const {logoutEveryAccount, login} = useSessionApi()
  const {openModal} = useModalControls()
  const onboardingDispatch = useOnboardingDispatch()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const onPressSignInAlice = async () => {
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
    <View style={{position: 'absolute', top: 100, right: 0, zIndex: 100}}>
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
        testID="e2eOpenInviteCodesModal"
        onPress={() => openModal({name: 'invite-codes'})}
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
      {/* TODO remove this entire control when experiment is over */}
      <Pressable
        testID="e2eStartLongboarding"
        onPress={() => {
          onboardingDispatch({type: 'start'})
        }}
        accessibilityRole="button"
        style={BTN}
      />
    </View>
  )
}
