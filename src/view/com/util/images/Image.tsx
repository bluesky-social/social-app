import React from 'react'
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native'
import FastImage from 'react-native-fast-image'
import {DELAY_PRESS_IN} from './constants'
import {LOADING} from '../../../lib/assets'

export function Image({
  uri,
  onPress,
  onLongPress,
  onPressIn,
  style,
}: {
  uri: string
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      delayPressIn={DELAY_PRESS_IN}
      style={[styles.container, style]}>
      <FastImage style={styles.image} source={{uri}} defaultSource={LOADING} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
})
