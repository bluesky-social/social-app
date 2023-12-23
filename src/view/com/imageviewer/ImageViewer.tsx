import React from 'react'
import {useImageViewer} from 'view/com/imageviewer/ImageViewerContext'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {Dimensions, NativeSyntheticEvent, StyleSheet, View} from 'react-native'
import {ImageViewerHeader} from 'view/com/imageviewer/ImageViewerHeader'
import {ImageViewerFooter} from 'view/com/imageviewer/ImageViewerFooter'
import {ImageViewerItem} from 'view/com/imageviewer/ImageViewerItem'
import PagerView from 'react-native-pager-view'
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window')

export function ImageViewer() {
  const {state, dispatch} = useImageViewer()
  const {images, index, isVisible, measurement} = state

  const [isScaled, setIsScaled] = React.useState(false)
  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)
  const [currentImage, setCurrentImage] = React.useState(images![index])

  const opacity = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)
  const top = useSharedValue(0)

  // Reset the viewer whenever it closes
  React.useEffect(() => {
    if (isVisible) return

    opacity.value = 1
    backgroundOpacity.value = 0
  })

  const onCloseViewer = React.useCallback(
    (direction: 'up' | 'down' = 'down') => {
      const toValue = direction === 'up' ? -SCREEN_HEIGHT : SCREEN_HEIGHT

      top.value = withTiming(toValue, {duration: 200})
      accessoryOpacity.value = withTiming(0, {duration: 200})
      opacity.value = withTiming(0, {duration: 200}, () => {
        runOnJS(dispatch)({
          type: 'setVisible',
          payload: false,
        })
      })
    },
    [accessoryOpacity, dispatch, opacity, top],
  )

  const onPageSelected = React.useCallback(
    (e: NativeSyntheticEvent<Readonly<{position: number}>>) => {
      setCurrentImage(images![e.nativeEvent.position])
    },
    [images],
  )

  const containerStyle = useAnimatedStyle(() => ({
    top: top.value,
    opacity: opacity.value,
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryOpacity.value,
  }))

  const onPanEnd = (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const velocity = Math.abs(e.velocityY)
    const direction = e.velocityY > 0 ? 'down' : 'up'

    if (velocity > 800) {
      // Close the viewer
      runOnJS(onCloseViewer)(direction)
      return
    }
  }

  const panGesture = Gesture.Pan().onEnd(onPanEnd).enabled(!isScaled)

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[styles.accessory, styles.headerAccessory, accessoryStyle]}>
        <ImageViewerHeader
          onCloseViewer={onCloseViewer}
          visible={accessoriesVisible}
        />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <PagerView
          style={styles.container}
          initialPage={index}
          scrollEnabled={!isScaled}
          overdrag
          onPageSelected={onPageSelected}>
          {images?.map((image, i) => (
            <View style={styles.container} key={i}>
              <ImageViewerItem
                image={images![i]}
                index={i}
                initialIndex={index}
                measurement={measurement}
                isVisible={isVisible}
                setIsScaled={setIsScaled}
                setAccessoriesVisible={setAccessoriesVisible}
                opacity={opacity}
                accessoryOpacity={accessoryOpacity}
                backgroundOpacity={backgroundOpacity}
              />
            </View>
          ))}
        </PagerView>
      </GestureDetector>
      <Animated.View
        style={[styles.accessory, styles.footerAccessory, accessoryStyle]}>
        <ImageViewerFooter
          currentImage={currentImage}
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
    zIndex: 1,
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
