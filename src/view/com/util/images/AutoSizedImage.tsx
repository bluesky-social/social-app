import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {clamp} from 'lib/numbers'
import {useStores} from 'state/index'
import {Dimensions} from 'lib/media/types'

export const DELAY_PRESS_IN = 500
const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 5 // 5/1

interface Props {
  alt?: string
  uri: string
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export function AutoSizedImage({
  alt,
  uri,
  onPress,
  onLongPress,
  onPressIn,
  style,
  children = null,
}: Props) {
  const store = useStores()
  const [dim, setDim] = React.useState<Dimensions | undefined>(
    store.imageSizes.get(uri),
  )
  const [aspectRatio, setAspectRatio] = React.useState<number>(
    dim ? calc(dim) : 1,
  )
  React.useEffect(() => {
    let aborted = false
    if (dim) {
      return
    }
    store.imageSizes.fetch(uri).then(newDim => {
      if (aborted) {
        return
      }
      setDim(newDim)
      setAspectRatio(calc(newDim))
    })
  }, [dim, setDim, setAspectRatio, store, uri])

  if (onPress || onLongPress || onPressIn) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        delayPressIn={DELAY_PRESS_IN}
        style={[styles.container, style]}
        accessible={true}
        accessibilityLabel="Share image"
        accessibilityHint="Opens ways of sharing image">
        <Image
          style={[styles.image, {aspectRatio}]}
          source={uri}
          accessible={true} // Must set for `accessibilityLabel` to work
          accessibilityIgnoresInvertColors
          accessibilityLabel={alt}
          accessibilityHint=""
        />
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        style={[styles.image, {aspectRatio}]}
        source={{uri}}
        accessible={true} // Must set for `accessibilityLabel` to work
        accessibilityIgnoresInvertColors
        accessibilityLabel={alt}
        accessibilityHint=""
      />
      {children}
    </View>
  )
}

function calc(dim: Dimensions) {
  if (dim.width === 0 || dim.height === 0) {
    return 1
  }
  return clamp(dim.width / dim.height, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO)
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
})
