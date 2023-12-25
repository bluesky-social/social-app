import React from 'react'
import {Image} from 'expo-image'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'
import {ImageStyle, Pressable, StyleSheet, Text, View} from 'react-native'
import {Dimensions} from 'lib/media/types'
import {clamp} from 'lib/numbers'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useImageViewerControls} from 'state/imageViewer.tsx'

interface IProps {
  images: ViewImage[]
  index: number
  imageStyle?: ImageStyle
}

const MIN_ASPECT_RATIO = 0.33 // 1/3
const MAX_ASPECT_RATIO = 10 // 10/1

function ViewerImage({images, index, imageStyle}: IProps) {
  const {isMobile} = useWebMediaQueries()
  const {setState} = useImageViewerControls()

  const ref = React.useRef<View>(null)
  const isLoaded = React.useRef(false)

  const image = React.useMemo(() => images[index], [images, index])

  // TODO shutting this up for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aspectRatio, setAspectRatio] = React.useState<number>(
    image.aspectRatio ? calc(image.aspectRatio) : 1,
  )

  const onPress = React.useCallback(() => {
    if (!isLoaded.current) return

    ref.current?.measure((x, y, width, height, pageX, pageY) => {
      const measurement = {x, y, width, height, pageX, pageY}

      setState({
        images,
        index,
        measurement,
        isVisible: true,
      })
    })
  }, [images, index, setState])

  const onLoad = React.useCallback(() => {
    isLoaded.current = true
  }, [])

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      ref={ref}
      style={[
        styles.imageContainer,
        styles.singleImage,
        isMobile && styles.singleImageMobile,
        imageStyle,
      ]}>
      {images.length === 1 ? (
        <Image
          source={{uri: image.thumb}}
          onLoad={onLoad}
          style={[{aspectRatio}]}
          cachePolicy="memory-disk"
          accessible
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Image
          source={{uri: image.thumb}}
          onLoad={onLoad}
          style={[styles.imageStyle]}
          cachePolicy="memory-disk"
          accessible
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      )}

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
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
  },
  imageStyle: {
    flex: 1,
    borderRadius: 8,
  },
  singleImage: {
    maxHeight: 1000,
  },
  singleImageMobile: {
    maxHeight: 500,
  },
  multiImage: {
    flex: 1,
  },
})

function calc(dim: Dimensions) {
  if (dim.width === 0 || dim.height === 0) {
    return 1
  }
  return clamp(dim.width / dim.height, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO)
}

export default React.memo(ViewerImage)
