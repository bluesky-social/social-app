import React from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {NativeSyntheticEvent, StyleSheet, View} from 'react-native'
import PagerView from 'react-native-pager-view'
import ImageViewerFooter from 'view/com/imageviewer/ImageViewerFooter'
import ImageViewerHeader from 'view/com/imageviewer/ImageViewerHeader'
import ImageViewerItem from 'view/com/imageviewer/ImageViewerItem'
import {gestureHandlerRootHOC} from 'react-native-gesture-handler'
import {useImageViewerControls, useImageViewerState} from 'state/imageViewer'

function ImageViewer() {
  const {images, initialIndex, hideFooter} = useImageViewerState()
  const {setVisible} = useImageViewerControls()

  const [isScaled, setIsScaled] = React.useState(false)
  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)

  const opacity = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)

  const onCloseViewer = React.useCallback(() => {
    'worklet'

    accessoryOpacity.value = withTiming(0, {duration: 200})
    opacity.value = withTiming(0, {duration: 200}, () => {
      runOnJS(setVisible)(false)
    })
  }, [accessoryOpacity, opacity, setVisible])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryOpacity.value,
  }))

  const [currentImage, setCurrentImage] = React.useState(images?.[initialIndex])

  const onPageSelected = React.useCallback(
    (e: NativeSyntheticEvent<Readonly<{position: number}>>) => {
      setCurrentImage(images?.[e.nativeEvent.position])
    },
    [images],
  )

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {accessoriesVisible && (
        <Animated.View
          style={[styles.accessory, styles.headerAccessory, accessoryStyle]}
          entering={FadeIn}
          exiting={FadeOut}>
          <ImageViewerHeader onCloseViewer={onCloseViewer} />
        </Animated.View>
      )}

      <PagerView
        style={styles.container}
        initialPage={initialIndex}
        scrollEnabled={!isScaled}
        overdrag
        onPageSelected={onPageSelected}>
        {images?.map((image, i) => (
          <View style={styles.container} key={i}>
            <ImageViewerItem
              image={images[i]}
              index={i}
              initialIndex={initialIndex}
              setIsScaled={setIsScaled}
              setAccessoriesVisible={setAccessoriesVisible}
              onCloseViewer={onCloseViewer}
              opacity={opacity}
              accessoryOpacity={accessoryOpacity}
              backgroundOpacity={backgroundOpacity}
            />
          </View>
        ))}
      </PagerView>
      {!hideFooter && accessoriesVisible && (
        <Animated.View
          style={[styles.accessory, styles.footerAccessory, accessoryStyle]}
          entering={FadeIn}
          exiting={FadeOut}>
          <ImageViewerFooter currentImage={currentImage} />
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -2, // android
  },
  accessory: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  headerAccessory: {
    top: 0,
  },
  footerAccessory: {
    bottom: 0,
  },
})

export default gestureHandlerRootHOC(ImageViewer)
