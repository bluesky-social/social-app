import React from 'react'
import {StyleProp, StyleSheet, Pressable, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {clamp} from 'lib/numbers'
import {Dimensions} from 'lib/media/types'
import * as imageSizes from 'lib/media/image-sizes'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 10 // 10/1

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
  const {_} = useLingui()
  const [dim, setDim] = React.useState<Dimensions | undefined>(
    dimensionsHint || imageSizes.get(uri),
  )
  const [aspectRatio, setAspectRatio] = React.useState<number>(
    dim ? calc(dim) : 1,
  )
  React.useEffect(() => {
    let aborted = false
    if (dim) {
      return
    }
    imageSizes.fetch(uri).then(newDim => {
      if (aborted) {
        return
      }
      setDim(newDim)
      setAspectRatio(calc(newDim))
    })
  }, [dim, setDim, setAspectRatio, uri])

  if (onPress || onLongPress || onPressIn) {
    return (
      // disable a11y rule because in this case we want the tags on the image (#1640)
      // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
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
          accessibilityHint={_(msg`Tap to view fully`)}
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
