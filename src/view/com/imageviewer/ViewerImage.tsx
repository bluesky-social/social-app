import React from 'react'
import {useImageViewer} from 'view/com/imageviewer/ImageViewerContext'
import {Image} from 'expo-image'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {Dimensions} from 'lib/media/types'
import {clamp} from 'lib/numbers'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

interface IProps {
  images: ViewImage[]
  index: number
}

const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 10 // 10/1

const AnimatedImage = Animated.createAnimatedComponent(Image)

export function ViewerImage({images, index}: IProps) {
  const {dispatch} = useImageViewer()
  const ref = React.useRef<View>(null)

  const image = React.useMemo(() => images[index], [images, index])

  const [aspectRatio, setAspectRatio] = React.useState<number>(
    image.aspectRatio ? calc(image.aspectRatio) : 1,
  )

  const imageOpacity = useSharedValue(0)

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }))

  const onPress = React.useCallback(() => {
    ref.current?.measure((x, y, width, height, pageX, pageY) => {
      const measurement = {x, y, width, height, pageX, pageY}

      dispatch({
        type: 'setState',
        payload: {
          images,
          index,
          measurement,
          isVisible: true,
        },
      })

      setTimeout(() => {
        imageOpacity.value = 0

        setTimeout(() => {
          imageOpacity.value = 1
        }, 300)
      }, 50)
    })
  }, [images, index])

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      ref={ref}
      style={styles.singleImage}>
      <AnimatedImage
        source={{uri: image.thumb}}
        style={[styles.image, {aspectRatio}]}
        cachePolicy="memory-disk"
      />
      {image.alt === '' ? null : (
        <View style={styles.altContainer}>
          <Text style={styles.alt} accessible={false}>
            ALT
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    left: 6,
    bottom: 6,
  },
  alt: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
  },
  singleImage: {
    borderRadius: 8,
    maxHeight: 1000,
  },
  singleImageMobile: {
    maxHeight: 500,
  },
})

function calc(dim: Dimensions) {
  if (dim.width === 0 || dim.height === 0) {
    return 1
  }
  return clamp(dim.width / dim.height, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO)
}
