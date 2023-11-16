import React from 'react'
import {Pressable, View} from 'react-native'
import {navigate} from '../../../Navigation'
import {useModalControls} from '#/state/modals'
import {useQueryClient} from '@tanstack/react-query'
import {useSessionApi} from '#/state/session'
import {useSetFeedViewPreferencesMutation} from '#/state/queries/preferences'

/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */

const BTN = {height: 1, width: 1, backgroundColor: 'red'}

export function TestCtrls() {
  const queryClient = useQueryClient()
  const {logout, login} = useSessionApi()
  const {openModal} = useModalControls()
  const {mutate: setFeedViewPref} = useSetFeedViewPreferencesMutation()
  const onPressSignInAlice = async () => {
    await login({
      service: 'http://localhost:3000',
      identifier: 'alice.test',
      password: 'hunter2',
    })
  }
  const onPressSignInBob = async () => {
    await login({
      service: 'http://localhost:3000',
      identifier: 'bob.test',
      password: 'hunter2',
    })
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
        onPress={() => logout()}
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
        testID="e2eToggleMergefeed"
        onPress={() => setFeedViewPref({lab_mergeFeedEnabled: true})}
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
    </View>
  )
}
