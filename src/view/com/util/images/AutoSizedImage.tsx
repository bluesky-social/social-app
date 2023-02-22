import React from 'react'
import {StyleProp, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native'
import Image, {OnLoadEvent} from 'view/com/util/images/Image'
import {clamp} from 'lib/numbers'

export const DELAY_PRESS_IN = 500
const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 5 // 5/1

export function AutoSizedImage({
  uri,
  onPress,
  onLongPress,
  onPressIn,
  style,
  children = null,
}: {
  uri: string
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const [aspectRatio, setAspectRatio] = React.useState<number>(1)
  const onLoad = (e: OnLoadEvent) => {
    setAspectRatio(
      clamp(
        e.nativeEvent.width / e.nativeEvent.height,
        MIN_ASPECT_RATIO,
        MAX_ASPECT_RATIO,
      ),
    )
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      delayPressIn={DELAY_PRESS_IN}
      style={[styles.container, style]}>
      <Image
        style={[styles.image, {aspectRatio}]}
        source={{uri}}
        onLoad={onLoad}
      />
      {children}
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
