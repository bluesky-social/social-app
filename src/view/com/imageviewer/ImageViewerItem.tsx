import React from 'react'
import {Platform, StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import {Image, ImageLoadEventData} from 'expo-image'
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import {IImageViewerItemProps} from 'view/com/imageviewer/types'
import {useImageViewerState} from 'state/imageViewer'
import {isAndroid} from 'platform/detection.ts'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries.tsx'

const IS_WEB = Platform.OS === 'web'
const WITH_TIMING_CONFIG = {
  duration: 200,
}
const PAN_WITH_TIMING_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.ease),
}
const MAX_SCALE = 3

const calc = (
  height: number,
  width: number,
  screenHeight: number,
  screenWidth: number,
) => {
  const heightRatio = (screenHeight * (!IS_WEB ? 0.9 : 1)) / height
  const widthRatio = screenWidth / width

  const ratio = Math.min(widthRatio, heightRatio)

  return {
    height: height * ratio,
    width: width * ratio,
  }
}

function ImageViewerItem({
  image,
  index,
  initialIndex,
  setIsScaled,
  setAccessoriesVisible,
  opacity,
  accessoryOpacity,
  backgroundOpacity,
  onCloseViewer,
}: IImageViewerItemProps) {
  const {height: screenHeight, width: screenWidth} = useWindowDimensions()
  const {isMobile} = useWebMediaQueries()
  const {isVisible, measurement, initialDimensions} = useImageViewerState()

  const [source, setSource] = React.useState(image.thumb)
  const [panGestureEnabled, setPanGestureEnabled] = React.useState(false)

  const ranInitialAnimation = React.useRef(false)

  const positionX = useSharedValue(0)
  const positionY = useSharedValue(0)

  const lastTranslateX = useSharedValue(0)
  const lastTranslateY = useSharedValue(0)

  const height = useSharedValue(1)
  const width = useSharedValue(1)

  const realDimensions = useSharedValue({height: 0, width: 0})

  const center = useSharedValue({x: 0, y: 0})

  const scale = useSharedValue<number>(1)
  const lastScale = useSharedValue<number>(1)

  const getMaxPosition = () => {
    'worklet'
    return {
      x: ((scale.value - 1) * width.value) / 2,
      y: ((scale.value - 1) * height.value) / 2,
    }
  }

  const getScaledDimensions = () => {
    'worklet'

    return {
      height: height.value * scale.value,
      width: width.value * scale.value,
    }
  }

  // Update isScaled when the scale changes and show/hide the accessories
  useAnimatedReaction(
    () => scale.value,
    (curr, prev) => {
      if (curr === 1 && prev !== 1) {
        runOnJS(setIsScaled)(false)
        runOnJS(setPanGestureEnabled)(false)
        runOnJS(setAccessoriesVisible)(true)
      } else if (curr !== 1 && prev === 1) {
        runOnJS(setIsScaled)(true)
        runOnJS(setPanGestureEnabled)(true)
        runOnJS(setAccessoriesVisible)(false)
      }
    },
  )

  // Helper function for recentering the image
  const centerImage = React.useCallback(
    (animated = true) => {
      'worklet'
      const {x, y} = center.value

      if (animated) {
        positionX.value = withTiming(x, WITH_TIMING_CONFIG)
        positionY.value = withTiming(y, WITH_TIMING_CONFIG)
      } else {
        positionX.value = x
        positionY.value = y
      }
    },
    [center, positionX, positionY],
  )

  // Helper function to set the proper image dimensions
  const setImageDimensions = React.useCallback(
    (h: number, w: number, animated = false): void => {
      'worklet'
      // Calculate the dimensions for the screen
      const newDims = calc(h, w, screenHeight, screenWidth)

      // Set those dimensions
      center.value = {
        x: (screenWidth - newDims.width) / 2,
        y: (screenHeight - newDims.height) / 2,
      }
      realDimensions.value = {
        height: newDims.height,
        width: newDims.width,
      }

      if (animated) {
        height.value = withTiming(newDims.height, WITH_TIMING_CONFIG)
        width.value = withTiming(newDims.width, WITH_TIMING_CONFIG)
      } else {
        height.value = newDims.height
        width.value = newDims.width
      }
    },
    [center, height, width, realDimensions, screenHeight, screenWidth],
  )

  // Handle the image loading so we can get the dimensions of the images that are not the main image
  const onLoad = React.useCallback(
    (e: ImageLoadEventData) => {
      // We don't need to change the dims if we have already set them
      if (height.value !== 1 && width.value !== 1) {
        return
      }

      setImageDimensions(e.source.height, e.source.width)

      runOnUI(centerImage)(false)
    },
    [height, width, centerImage, setImageDimensions],
  )

  const prefetchAndReplace = () => {
    Image.prefetch(image.fullsize).then(() => {
      setSource(image.fullsize)
    })
  }

  // Handle opening the image viewer
  React.useEffect(() => {
    'worklet'
    // Do nothing when the viewer closes
    if (!isVisible) return

    // For all images that are not the current image, set the dimensions
    if (index !== initialIndex || ranInitialAnimation.current) {
      runOnJS(prefetchAndReplace)()
      return
    }

    ranInitialAnimation.current = true
    opacity.value = 1

    // Fade in the background and show accessories
    accessoryOpacity.value = withTiming(1, WITH_TIMING_CONFIG)
    backgroundOpacity.value = withTiming(1, WITH_TIMING_CONFIG)

    // If there are no measurements, just prefetch
    if (!measurement) {
      runOnJS(prefetchAndReplace)()
      return
    }

    // Set the initial position of the image in the modal
    positionX.value = measurement?.pageX ?? 0
    positionY.value = measurement?.pageY ?? 0

    // Also set the initial height and width
    height.value = measurement?.height ?? screenHeight
    width.value = measurement?.width ?? screenWidth

    setImageDimensions(
      initialDimensions?.height ?? 1,
      initialDimensions?.width ?? 1,
      true,
    )

    runOnUI(centerImage)()

    // Running this on the animation callback doesn't work on web, so we will just use setTimeout. Run after the 200ms
    // animation
    setTimeout(() => {
      runOnJS(prefetchAndReplace)()
    }, 200)

    // This only needs to re-run whenever the screen height or width changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenHeight, screenWidth])

  // Callback for reseting the last translate
  const onResetLastTranslate = () => {
    'worklet'
    lastTranslateX.value = 0
    lastTranslateY.value = 0
  }

  const onPanUpdate = (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
  ) => {
    'worklet'
    if (scale.value === 1) return

    positionX.value += e.translationX - lastTranslateX.value
    positionY.value += e.translationY - lastTranslateY.value

    // Store the new values
    lastTranslateX.value = e.translationX
    lastTranslateY.value = e.translationY
  }

  const onPanEnd = (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    'worklet'
    const {x: maxX, y: maxY} = getMaxPosition()
    const scaledDimensions = getScaledDimensions()

    // Deal with the width first.
    if (scaledDimensions.width < screenWidth) {
      // We can just return the image to the X center if the width is less than the screen width
      positionX.value = withTiming(center.value.x, PAN_WITH_TIMING_CONFIG)
    } else if (Math.abs(positionX.value) > maxX) {
      // If the image is too far outside the x bounds, return it to the max
      positionX.value = withTiming(
        Math.sign(positionX.value) === 1 ? maxX : -maxX,
        PAN_WITH_TIMING_CONFIG,
      )
    } else {
      if (!isMobile) return

      // We want to decay the velocity of the drag
      positionX.value = withDecay({
        clamp: [-maxX, maxX],
        rubberBandEffect: isAndroid,
        rubberBandFactor: 0.5 * scale.value,
        velocity: (e.velocityX * 1.5) / scale.value,
        velocityFactor: 0.5 * scale.value,
      })
    }

    // Same for the height
    if (scaledDimensions.height < screenHeight) {
      positionY.value = withTiming(center.value.y, PAN_WITH_TIMING_CONFIG)
    } else if (Math.abs(positionY.value) > maxY) {
      positionY.value = withTiming(
        Math.sign(positionY.value) === 1 ? maxY : -maxY,
        PAN_WITH_TIMING_CONFIG,
      )
    } else {
      if (!isMobile) return

      positionY.value = withDecay({
        clamp: [-maxY, maxY],
        rubberBandEffect: isAndroid,
        rubberBandFactor: 0.5 * scale.value,
        velocity: (e.velocityY * 1.5) / scale.value,
        velocityFactor: 0.5 * scale.value,
      })
    }
  }

  const panGesture = Gesture.Pan()
    .minPointers(panGestureEnabled ? 1 : 2)
    .onStart(onResetLastTranslate)
    .onUpdate(onPanUpdate)
    .onEnd(onPanEnd)

  const onDoubleTap = () => {
    'worklet'
    console.log('double')

    if (scale.value !== 1) {
      centerImage()
      scale.value = withTiming(1, WITH_TIMING_CONFIG)
      lastScale.value = 1
    } else {
      scale.value = withTiming(2, WITH_TIMING_CONFIG)
      lastScale.value = 2
    }
  }

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(300)
    .maxDistance(25)
    .onEnd(onDoubleTap)

  const onTap = () => {
    // Do nothing if the scale is not one
    if (scale.value !== 1) return

    // Show or hide the accessories
    setAccessoriesVisible(prev => !prev)
  }

  // Handle the single tap gesture. Only run this after the double tap gesture fails (more than 300ms has passed since
  // the first tap). Ensure it isn't a "drag" either by setting max delta.
  const tapGesture = Gesture.Tap()
    .requireExternalGestureToFail(doubleTapGesture)
    .maxDuration(100)
    .maxDeltaY(10)
    .maxDeltaX(10)
    .onEnd(onTap)

  const onPinchUpdate = (
    e: GestureUpdateEvent<PinchGestureHandlerEventPayload>,
  ) => {
    'worklet'
    scale.value = lastScale.value * e.scale
  }

  const onPinchEnd = () => {
    'worklet'
    if (scale.value <= 1) {
      // Play a haptic
      // runOnJS(Haptics.impact)('impactLight')

      // Set the scale to one
      scale.value = withTiming(1, WITH_TIMING_CONFIG)
      lastScale.value = 1

      centerImage()
    } else if (scale.value > MAX_SCALE) {
      // Play a haptic
      // runOnJS(Haptics.impact)('impactLight')

      scale.value = withTiming(3, WITH_TIMING_CONFIG)
      lastScale.value = 3
    } else {
      // Set the last scale to the current scale
      lastScale.value = scale.value
    }
  }

  const pinchGesture = Gesture.Pinch().onUpdate(onPinchUpdate).onEnd(onPinchEnd)

  const onCloseGestureUpdate = (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
  ) => {
    'worklet'
    positionY.value += e.translationY - lastTranslateY.value
    backgroundOpacity.value = 1 - Math.abs(e.translationY) / screenHeight
    lastTranslateY.value = e.translationY
  }

  const onCloseGestureEnd = (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
  ) => {
    'worklet'
    backgroundOpacity.value = withTiming(1, WITH_TIMING_CONFIG)

    if (Math.abs(e.velocityY) < 1000) {
      centerImage()
      return
    }

    positionY.value = withDecay({
      clamp: [-screenHeight, screenHeight],
      velocity: e.velocityY,
    })
    onCloseViewer()
  }

  const closeGesture = Gesture.Pan()
    .enabled(!panGestureEnabled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onStart(onResetLastTranslate)
    .onUpdate(onCloseGestureUpdate)
    .onEnd(onCloseGestureEnd)

  // Combine the gestures
  // Run tap gestures together so we can run tap only when double tap fails
  const tapGestures = Gesture.Simultaneous(doubleTapGesture, tapGesture)
  const pinchAndPanGestures = Gesture.Simultaneous(pinchGesture, panGesture)
  const allGestures = Gesture.Race(
    closeGesture,
    tapGestures,
    IS_WEB ? panGesture : pinchAndPanGestures,
  ) // Close gesture should have priority over the other gestures, and only one should run at a time

  // Animated styles
  const positionStyle = useAnimatedStyle(() => ({
    transform: [{translateX: positionX.value}, {translateY: positionY.value}],
  }))
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))
  const dimensionsStyle = useAnimatedStyle(() => ({
    height: height.value,
    width: width.value,
  }))

  // Animated image does not play nice on web. Instead, we have to use an additional animated view to get things right.
  // Needs to be wrapped in a flex view so the entire screen detects gestures
  return (
    <GestureDetector gesture={allGestures}>
      <View style={styles.container}>
        <Animated.View style={[positionStyle]}>
          <Animated.View style={[scaleStyle, dimensionsStyle]}>
            <Image
              source={{uri: source}}
              style={styles.image}
              cachePolicy="memory-disk"
              onLoad={onLoad}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
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

// Wrap this in gestureHandlerRootHOC since Android requires it when using gestures in a modal
export default React.memo(ImageViewerItem)
