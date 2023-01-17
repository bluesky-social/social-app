import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import {UserAvatar} from '../util/UserAvatar'
import {ProfileViewModel} from '../../../state/models/profile-view'

export function Component({profileView}: {profileView: ProfileViewModel}) {
  const winDim = useWindowDimensions()
  const top = winDim.height / 2 - (winDim.width - 40) / 2 - 100
  const spinnerStyle = React.useMemo(
    () => ({
      left: winDim.width / 2 - 30,
      top: winDim.height / 2 - (winDim.width - 40) / 2 - 80,
    }),
    [winDim.width, winDim.height],
  )
  return (
    <View style={[styles.container, {top}]}>
      <ActivityIndicator style={[styles.loading, spinnerStyle]} size="large" />
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
  loading: {
    position: 'absolute',
  },
})
