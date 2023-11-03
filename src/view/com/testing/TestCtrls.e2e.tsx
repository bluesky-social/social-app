import React from 'react'
import {Pressable, View} from 'react-native'
import {useStores} from 'state/index'
import {navigate} from '../../../Navigation'

/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */

const BTN = {height: 1, width: 1, backgroundColor: 'red'}

export function TestCtrls() {
  const store = useStores()
  const onPressSignInAlice = async () => {
    await store.session.login({
      service: 'http://localhost:3000',
      identifier: 'alice.test',
      password: 'hunter2',
    })
  }
  const onPressSignInBob = async () => {
    await store.session.login({
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
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eSignInBob"
        onPress={onPressSignInBob}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eSignOut"
        onPress={() => store.session.logout()}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoHome"
        onPress={() => navigate('Home')}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoSettings"
        onPress={() => navigate('Settings')}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoModeration"
        onPress={() => navigate('Moderation')}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eGotoLists"
        onPress={() => navigate('Lists')}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eToggleMergefeed"
        onPress={() => store.preferences.toggleHomeFeedMergeFeedEnabled()}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eRefreshHome"
        onPress={() => store.me.mainFeed.refresh()}
        role="button"
        style={BTN}
      />
      <Pressable
        testID="e2eOpenInviteCodesModal"
        onPress={() => store.shell.openModal({name: 'invite-codes'})}
        role="button"
        style={BTN}
      />
    </View>
  )
}
