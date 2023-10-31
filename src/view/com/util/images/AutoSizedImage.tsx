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

export type FullAxis = 'width' | 'height' | 'largest' | 'smallest'

interface Props {
  alt?: string
  uri: string
  dimensionsHint?: Dimensions
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  style?: StyleProp<ViewStyle>
  landscapeExtraStyle?: StyleProp<ViewStyle>
  portraitExtraStyle?: StyleProp<ViewStyle>
  fullAxis?: FullAxis
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
  landscapeExtraStyle,
  portraitExtraStyle,
  fullAxis,
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
    return () => {
      aborted = true
    }
  }, [dim, setDim, setAspectRatio, store, uri])

  const isPortrait = aspectRatio < 1
  const xStyle = isPortrait ? portraitExtraStyle : landscapeExtraStyle
  const imageStyle =
    fullAxis === 'height' ||
    (isPortrait && fullAxis === 'largest') ||
    (!isPortrait && fullAxis === 'smallest')
      ? styles.fullHeight
      : styles.fullWidth

  if (onPress || onLongPress || onPressIn) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        delayPressIn={DELAY_PRESS_IN}
        style={[styles.container, style, xStyle]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={alt || 'Image'}
        accessibilityHint="Tap to view fully">
        <Image
          style={[imageStyle, {aspectRatio}]}
          source={uri}
          accessible={false} // Must set for `accessibilityLabel` to work
          accessibilityIgnoresInvertColors
        />
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, style, xStyle]}>
      <Image
        style={[imageStyle, {aspectRatio}]}
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
  fullWidth: {
    width: '100%',
  },
  fullHeight: {
    height: '100%',
  },
  none: {},
})
