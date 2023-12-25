import React from 'react'
import {Platform, StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import {IImageViewerItemProps} from 'view/com/imageviewer/types'
import {useImageViewerState} from 'state/imageViewer.tsx'

const IS_WEB = Platform.OS === 'web'
const WITH_TIMING_CONFIG = {
  duration: 200,
}
const PAN_WITH_TIMING_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.ease),
}
const MAX_SCALE = 3

function ImageViewerItem({
  image,
  index,
  initialIndex,
  setIsScaled,
  setAccessoriesVisible,
  opacity,
  accessoryOpacity,
  backgroundOpacity,
}: IImageViewerItemProps) {
  const {height: screenHeight, width: screenWidth} = useWindowDimensions()

  const {isVisible, measurement} = useImageViewerState()

  const [source, setSource] = React.useState(image.thumb)

  // Use this to enable/disable the pan gesture
  const [panGestureEnabled, setPanGestureEnabled] = React.useState(false)

  const ranInitialAnimation = React.useRef(false)

  const positionX = useSharedValue(0)
  const positionY = useSharedValue(0)

  const lastTranslateX = useSharedValue(0)
  const lastTranslateY = useSharedValue(0)

  const height = useSharedValue(0)
  const width = useSharedValue(0)

  const scale = useSharedValue(1)
  const lastScale = useSharedValue(1)

  // Update isScaled when the scale changes
  useAnimatedReaction(
    () => scale.value,
    (curr, prev) => {
      if (IS_WEB) return

      if (curr === 1 && prev !== 1) {
        runOnJS(setIsScaled!)(false)
        runOnJS(setPanGestureEnabled)(false)
      } else if (curr !== 1 && prev === 1) {
        runOnJS(setIsScaled!)(true)
        runOnJS(setPanGestureEnabled)(true)
      }
    },
  )

  const prefetchAndReplace = () => {
    Image.prefetch(image.fullsize).then(() => {
      setSource(image.fullsize)
    })
  }

  const centerImage = (animated = true) => {
    'worklet'

    if (animated) {
      positionX.value = withTiming(0, WITH_TIMING_CONFIG)
      positionY.value = withTiming(0, WITH_TIMING_CONFIG)
    } else {
      positionX.value = 0
      positionY.value = 0
    }
  }

  // Handle opening the image viewer
  React.useEffect(() => {
    'worklet'

    // Do nothing when the viewer closes
    if (!isVisible) return

    // For all images that are not the current image, set the dimensions
    if (index !== initialIndex || ranInitialAnimation.current) {
      height.value = screenHeight
      width.value = screenWidth
      runOnJS(prefetchAndReplace)()
      centerImage(false)
      return
    }

    // Remember that we animated already
    ranInitialAnimation.current = true

    // Reset the opacity
    opacity.value = 1

    // Set the initial position of the image in the modal
    positionX.value = measurement?.pageX ?? 0
    positionY.value = measurement?.pageY ?? 0

    // Also set the initial height and width
    height.value = measurement?.height ?? screenHeight
    width.value = measurement?.width ?? screenWidth

    // Now set the new dimensions with timing
    height.value = withTiming(screenHeight, WITH_TIMING_CONFIG)
    width.value = withTiming(screenWidth, WITH_TIMING_CONFIG)

    // Center the image
    centerImage()

    // Fade in the background and show accessories
    accessoryOpacity.value = withTiming(1, WITH_TIMING_CONFIG)

    // It doesn't matter which one of these we run the prefetch callback on. They all run for the same amount of time
    backgroundOpacity.value = withTiming(1, WITH_TIMING_CONFIG, () => {
      runOnJS(prefetchAndReplace)()
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, isVisible, screenHeight, screenWidth])

  const onPanUpdate = (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
  ) => {
    'worklet'

    if (scale.value === 1) return

    // Move the image by the difference in translation
    positionX.value += e.translationX - lastTranslateX.value
    positionY.value += e.translationY - lastTranslateY.value

    // Store the new values
    lastTranslateX.value = e.translationX
    lastTranslateY.value = e.translationY
  }

  const onPanEnd = (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    'worklet'

    // Reset the last translation values
    lastTranslateX.value = 0
    lastTranslateY.value = 0

    // Center image if the image is not zoomed
    if (scale.value <= 1) {
      centerImage()
    }

    // Get scaled dimensions
    const h = screenHeight * scale.value
    const w = screenWidth * scale.value

    const maxX = ((scale.value - 1) * screenWidth) / 2
    const maxY = ((scale.value - 1) * screenHeight) / 2

    // Deal with the width first.
    if (w < screenWidth) {
      // We can just return the image to the X center if the width is less than the screen width
      positionX.value = withTiming(0, PAN_WITH_TIMING_CONFIG)
    } else if (Math.abs(positionX.value) > maxX) {
      // If the image is too far outside the x bounds, return it to the max
      positionX.value = withTiming(
        Math.sign(positionX.value) === 1 ? maxX : -maxX,
        PAN_WITH_TIMING_CONFIG,
      )
    } else {
      // We want to decay the velocity of the drag
      positionX.value = withDecay({
        clamp: [-maxX, maxX],
        rubberBandEffect: true,
        rubberBandFactor: 0.5 * scale.value,
        velocity: (e.velocityX * 1.5) / scale.value,
        velocityFactor: 0.5 * scale.value,
      })
    }

    // Same for the height
    if (h < screenHeight) {
      // We can just return the image to the X center if the width is less than the screen width
      positionY.value = withTiming(0, PAN_WITH_TIMING_CONFIG)
    } else if (Math.abs(positionY.value) > maxY) {
      // If the image is too far outside the x bounds, return it to the max
      positionY.value = withTiming(
        Math.sign(positionY.value) === 1 ? maxY : -maxY,
        PAN_WITH_TIMING_CONFIG,
      )
    } else {
      // We want to decay the velocity of the drag
      positionY.value = withDecay({
        clamp: [-maxY, maxY],
        rubberBandEffect: true,
        rubberBandFactor: 0.5 * scale.value,
        velocity: (e.velocityY * 1.5) / scale.value,
        velocityFactor: 0.5 * scale.value,
      })
    }
  }

  const panGesture = Gesture.Pan()
    .onUpdate(onPanUpdate)
    .onEnd(onPanEnd)
    .enabled(panGestureEnabled)

  const onDoubleTap = () => {
    'worklet'

    // Hide accessories when we zoom in
    runOnJS(setAccessoriesVisible)(false)

    if (scale.value !== 1) {
      centerImage()
      scale.value = withTiming(1, WITH_TIMING_CONFIG)
      lastScale.value = 1
      return
    }

    // Zoom in to a scale of 2
    scale.value = withTiming(2, WITH_TIMING_CONFIG)
    lastScale.value = 2
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

  const onPinchStart = () => {
    'worklet'

    runOnJS(setAccessoriesVisible)(false)
  }

  const onPinchUpdate = (
    e: GestureUpdateEvent<PinchGestureHandlerEventPayload>,
  ) => {
    'worklet'

    scale.value = lastScale.value * e.scale
  }

  const onPinchEnd = () => {
    'worklet'

    if (scale.value < 1) {
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

  const pinchGesture = Gesture.Pinch()
    .onStart(onPinchStart)
    .onUpdate(onPinchUpdate)
    .onEnd(onPinchEnd)

  // Combine the gestures
  const tapGestures = Gesture.Simultaneous(tapGesture, doubleTapGesture)
  const pinchAndPanGestures = Gesture.Simultaneous(pinchGesture, panGesture)
  const allGestures = Gesture.Race(tapGestures, pinchAndPanGestures)

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
  // Additionally, for zoom/pan animations to properly work, we would need to set `draggable` to false on the image.
  // I'm actually not actually sure what the best way to do that is, but I suspect the *easiest* might be to just patch
  // expo-image and add a prop for it. For now I am just removing the gesture detector. The only animation that will
  // "work" is the measure/scale up animation and the fade out animation when we close the viewer.
  return (
    <GestureDetector gesture={IS_WEB ? tapGesture : allGestures}>
      <Animated.View style={positionStyle}>
        <Animated.View style={[scaleStyle, dimensionsStyle]}>
          <View style={styles.container}>
            <Image
              source={{uri: source}}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    height: IS_WEB ? '100%' : '90%',
    width: '100%',
  },
})

// Wrap this in gestureHandlerRootHOC since Android requires it when using gestures in a modal
export default React.memo(ImageViewerItem)
