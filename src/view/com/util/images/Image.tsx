import React from 'react'
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native'
import FastImage, {OnLoadEvent} from 'react-native-fast-image'
import {DELAY_PRESS_IN} from './constants'
import {LOADING} from '../../../lib/assets'
import {clamp} from '../../../../lib/numbers'

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
  const [aspectRatio, setAspectRatio] = React.useState<number>(1)
  const onLoad = (e: OnLoadEvent) => {
    setAspectRatio(clamp(e.nativeEvent.width / e.nativeEvent.height, 0.33, 5))
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      delayPressIn={DELAY_PRESS_IN}
      style={[styles.container, style]}>
      <FastImage
        style={[styles.image, {aspectRatio}]}
        source={{uri}}
        defaultSource={LOADING}
        onLoad={onLoad}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
})
