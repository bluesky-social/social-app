import React from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {Image, ImageLoadEventData} from 'expo-image'
import {IImageViewerItemProps} from 'view/com/imageviewer/types'
import {useImageViewerState} from 'state/imageViewer'
import {calculateViewerDimensions} from 'view/com/imageviewer/util.ts'

function ImageViewerItem({image}: IImageViewerItemProps) {
  const screenDimensions = useWindowDimensions()
  const {isVisible} = useImageViewerState()

  const [source, setSource] = React.useState(image.thumb)
  const [imageDimensions, setImageDimensions] = React.useState({
    height: 1,
    width: 1,
  })

  const prefetchAndReplace = React.useCallback(() => {
    Image.prefetch(image.fullsize).then(() => {
      setTimeout(() => {
        setSource(image.fullsize)
      }, 150) // This timeout prevents a flicker
    })
  }, [image])

  // Handle opening the image viewer
  React.useEffect(() => {
    if (!isVisible) return
    prefetchAndReplace()
  }, [isVisible, prefetchAndReplace])

  // Handle the image loading so that we can get the dimensions of the images that are not the main image
  const onLoad = React.useCallback(
    (e: ImageLoadEventData) => {
      if (imageDimensions.height !== 1) return

      const calculatedDimensions = calculateViewerDimensions(
        e.source,
        screenDimensions,
        1,
      )
      setImageDimensions(calculatedDimensions)
    },
    [imageDimensions.height, screenDimensions],
  )

  const imageStyle = React.useMemo(
    () => calculateViewerDimensions(imageDimensions, screenDimensions, 1),
    [screenDimensions, imageDimensions],
  )

  const positionStyle = React.useMemo(
    () => ({
      top: (screenDimensions.height - imageStyle.height) / 2,
      left: (screenDimensions.width - imageStyle.width) / 2,
    }),
    [screenDimensions, imageStyle],
  )

  return (
    <View style={[styles.container]}>
      <View style={[positionStyle]}>
        <View style={[imageStyle]}>
          <Image
            source={{uri: source}}
            style={styles.image}
            cachePolicy="memory-disk"
            onLoad={onLoad}
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
})

export default React.memo(ImageViewerItem)
