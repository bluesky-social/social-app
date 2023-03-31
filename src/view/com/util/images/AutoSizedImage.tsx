import React from 'react'
import {
  Image,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {clamp} from 'lib/numbers'
import {useStores} from 'state/index'
import {Dim} from 'lib/media/manip'

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
  const store = useStores()
  const [dim, setDim] = React.useState<Dim | undefined>(
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
        style={[styles.container, style]}>
        <Image style={[styles.image, {aspectRatio}]} source={{uri}} />
        {children}
      </TouchableOpacity>
    )
  }
  return (
    <View style={[styles.container, style]}>
      <Image style={[styles.image, {aspectRatio}]} source={{uri}} />
      {children}
    </View>
  )
}

function calc(dim: Dim) {
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
