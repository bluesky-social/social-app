import React from 'react'
import {StyleProp, StyleSheet, Pressable, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {clamp} from 'lib/numbers'
import {useStores} from 'state/index'
import {Dimensions} from 'lib/media/types'

const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 5 // 5/1

interface Props {
  alt?: string
  uri: string
  dimensionsHint?: Dimensions
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export function AutoSizedImage({
  alt,
  uri,
  dimensionsHint,
  onPress,
  onLongPress,
  onPressIn,
  style,
  children = null,
}: Props) {
  const store = useStores()
  const [dim, setDim] = React.useState<Dimensions | undefined>(
    dimensionsHint || store.imageSizes.get(uri),
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
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        style={[styles.container, style]}>
        <Image
          style={[styles.image, {aspectRatio}]}
          source={uri}
          accessible={true} // Must set for `accessibilityLabel` to work
          accessibilityIgnoresInvertColors
          accessibilityLabel={alt}
          accessibilityHint=""
        />
        {children}
      </Pressable>
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
