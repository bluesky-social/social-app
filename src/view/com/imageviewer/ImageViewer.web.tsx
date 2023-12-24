import React from 'react'
import {useImageViewer} from 'view/com/imageviewer/ImageViewerContext'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {Pressable, StyleSheet} from 'react-native'
import ImageViewerFooter from 'view/com/imageviewer/ImageViewerFooter'
import ImageViewerHeader from 'view/com/imageviewer/ImageViewerHeader'
import {gestureHandlerRootHOC} from 'react-native-gesture-handler'
import ImageViewerItem from 'view/com/imageviewer/ImageViewerItem'
import {SCREEN_WIDTH} from '@gorhom/bottom-sheet'

function ImageViewer() {
  const {state, dispatch} = useImageViewer()
  const {images, index, isVisible} = state

  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)
  const [currentIndex, setCurrentIndex] = React.useState(index)

  const opacity = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)

  // Reset the viewer whenever it closes
  React.useEffect(() => {
    if (isVisible) return

    opacity.value = 1
    backgroundOpacity.value = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  const onCloseViewer = React.useCallback(() => {
    accessoryOpacity.value = withTiming(0, {duration: 200})
    opacity.value = withTiming(0, {duration: 200}, () => {
      runOnJS(dispatch)({
        type: 'setVisible',
        payload: false,
      })
    })
  }, [accessoryOpacity, dispatch, opacity])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryOpacity.value,
  }))

  const onPrevPress = React.useCallback(() => {
    if (currentIndex === 0) return

    setCurrentIndex(currentIndex - 1)
  }, [currentIndex])

  const onNextPress = React.useCallback(() => {
    if (currentIndex === images.length - 1) return

    setCurrentIndex(currentIndex + 1)
  }, [currentIndex, images])

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[styles.accessory, styles.headerAccessory, accessoryStyle]}>
        <ImageViewerHeader
          onCloseViewer={onCloseViewer}
          visible={accessoriesVisible}
        />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        style={[styles.scrollButton, styles.leftScrollButton]}
        onPress={onPrevPress}
      />

      <ImageViewerItem
        image={images[currentIndex]}
        initialIndex={index}
        index={index}
        setAccessoriesVisible={setAccessoriesVisible}
        onCloseViewer={onCloseViewer}
        opacity={opacity}
        backgroundOpacity={backgroundOpacity}
        accessoryOpacity={accessoryOpacity}
      />

      <Pressable
        accessibilityRole="button"
        style={[styles.scrollButton, styles.rightScrollButton]}
        onPress={onNextPress}
      />

      <Animated.View
        style={[styles.accessory, styles.footerAccessory, accessoryStyle]}>
        <ImageViewerFooter
          currentImage={images[currentIndex]}
          visible={accessoriesVisible}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accessory: {
    position: 'absolute',
    zIndex: 2,
    left: 0,
    right: 0,
  },
  headerAccessory: {
    top: 0,
  },
  footerAccessory: {
    bottom: 0,
  },
  scrollButton: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: SCREEN_WIDTH > 600 ? 150 : 80,
  },
  leftScrollButton: {
    left: 0,
  },
  rightScrollButton: {
    right: 0,
  },
})

export default gestureHandlerRootHOC(ImageViewer)
