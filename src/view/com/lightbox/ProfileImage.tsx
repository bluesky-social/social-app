import React from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {UserAvatar} from '../util/UserAvatar'
import {ProfileViewModel} from '../../../state/models/profile-view'

export function Component({profileView}: {profileView: ProfileViewModel}) {
  const winDim = useWindowDimensions()
  const top = winDim.height / 2 - (winDim.width - 40) / 2 - 100
  return (
    <View style={[styles.container, {top}]}>
      <UserAvatar
        handle={profileView.handle}
        displayName={profileView.displayName}
        avatar={profileView.avatar}
        size={winDim.width - 40}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
  },
})
