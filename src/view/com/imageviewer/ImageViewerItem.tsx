import React from 'react'
import {Platform, StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
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

const IS_WEB = Platform.OS === 'web'
const WITH_TIMING_CONFIG = {
  duration: Platform.OS === 'android' ? 350 : 200,
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
  accessoryOpacity,
  backgroundOpacity,
  onCloseViewer,
}: IImageViewerItemProps) {
  const screenDimensions = useWindowDimensions()
  const {isVisible, measurement, initialDimensions} = useImageViewerState()

  const [source, setSource] = React.useState(image.thumb)
  const [panGestureEnabled, setPanGestureEnabled] = React.useState(false)

  const ranInitialAnimation = React.useRef(false)

  // Values for animating height and position of the image.
  const animatedHeight = useSharedValue(measurement?.height ?? 1)
  const animatedWidth = useSharedValue(measurement?.width ?? 1)
  const positionX = useSharedValue(measurement?.pageX ?? 0)
  const positionY = useSharedValue(measurement?.pageY ?? 0)

  // Values for storing translation info
  const lastTranslateX = useSharedValue(0)
  const lastTranslateY = useSharedValue(0)

  // Values for storing the scale of the image
  const scale = useSharedValue<number>(1)
  const lastScale = useSharedValue<number>(1)

  // Value for storing the dimensions of the image as rendered
  const imageDimensions = useSharedValue({
    height: 1,
    width: 1,
  })

  // Value for updating the center position of the image
  const center = useDerivedValue(() => {
    return {
      x: (screenDimensions.width - imageDimensions.value.width) / 2,
      y: (screenDimensions.height - imageDimensions.value.height) / 2,
    }
  })

  const scaledDimensions = useDerivedValue(() => {
    return calculateDimensions(
      imageDimensions.value,
      screenDimensions,
      scale.value,
    )
  })

  // Helper function for re-centering the image
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

  useAnimatedReaction(
    () => imageDimensions.value,
    () => {
      if (index !== initialIndex) {
        animatedHeight.value = imageDimensions.value.height
        animatedWidth.value = imageDimensions.value.width
        centerImage(false)
      }
    },
  )

  // Handle the image loading so that we can get the dimensions of the images that are not the main image
  const onLoad = React.useCallback(
    (e: ImageLoadEventData) => {
      'worklet'

      if (imageDimensions.value.height !== 1) return

      imageDimensions.value = calculateDimensions(
        e.source,
        screenDimensions,
        scale.value,
      )
    },
    [imageDimensions, scale.value, screenDimensions],
  )

  const prefetchAndReplace = React.useCallback(() => {
    Image.prefetch(image.fullsize).then(() => {
      setSource(image.fullsize)
    })
  }, [image])

  const onOpen = React.useCallback(() => {
    'worklet'
    // Fade in the background and show accessories
    accessoryOpacity.value = withTiming(1, WITH_TIMING_CONFIG)
    backgroundOpacity.value = withTiming(1, WITH_TIMING_CONFIG)

    // If there are no measurements, just prefetch
    if (!measurement) {
      runOnJS(prefetchAndReplace)()
      return
    }

    // Calculate the dimensions to render
    const calculatedDimensions = calculateDimensions(
      initialDimensions,
      screenDimensions,
      scale.value,
    )

    // Set those dimensions
    imageDimensions.value = {
      height: calculatedDimensions.height,
      width: calculatedDimensions.width,
    }
    animatedHeight.value = withTiming(
      calculatedDimensions.height,
      WITH_TIMING_CONFIG,
    )
    animatedWidth.value = withTiming(
      calculatedDimensions.width,
      WITH_TIMING_CONFIG,
    )
    positionX.value = withTiming(
      (screenDimensions.width - imageDimensions.value.width) / 2,
      WITH_TIMING_CONFIG,
    )
    positionY.value = withTiming(
      (screenDimensions.height - imageDimensions.value.height) / 2,
      WITH_TIMING_CONFIG,
    )

    // All the stable values are removed here, since we were using a lot of shared values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, initialIndex, measurement])

  // Handle opening the image viewer
  React.useEffect(() => {
    if (!isVisible) return

    if (!ranInitialAnimation.current) {
      ranInitialAnimation.current = true

      if (index === initialIndex) {
        runOnUI(onOpen)()
      }
      // Running this on the animation callback doesn't work on web, so we will just use setTimeout. Run after the 200ms
      // animation
      setTimeout(
        () => {
          runOnJS(prefetchAndReplace)()
        },
        Platform.OS === 'android' ? 350 : 250,
      )
    }
  }, [index, initialIndex, isVisible, onOpen, prefetchAndReplace])

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

    lastTranslateX.value = e.translationX
    lastTranslateY.value = e.translationY
  }

  const onPanEnd = (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    'worklet'
    // Get the blank space on either the x or y axis
    const diffX = (screenDimensions.width - imageDimensions.value.width) / 2
    const diffY = (screenDimensions.height - imageDimensions.value.height) / 2

    // Get the max and min values for all translations
    const maxX =
      (scaledDimensions.value.width - screenDimensions.width) / 2 +
      (diffX > 0 ? diffX : 0)
    const minX =
      diffX > 0
        ? Math.abs(scaledDimensions.value.width - screenDimensions.width) / 2 -
          diffX
        : -maxX
    const maxY =
      (scaledDimensions.value.height - screenDimensions.height) / 2 +
      (diffY > 0 ? diffY : 0)
    const minY =
      diffY > 0
        ? Math.abs(scaledDimensions.value.height - screenDimensions.height) /
            2 -
          diffY
        : -maxY

    if (scaledDimensions.value.width <= screenDimensions.width) {
      positionX.value = withTiming(center.value.x, PAN_WITH_TIMING_CONFIG)
    } else if (positionX.value > maxX) {
      positionX.value = withTiming(maxX, PAN_WITH_TIMING_CONFIG)
    } else if (diffX <= 0 && positionX.value < minX) {
      positionX.value = withTiming(minX, PAN_WITH_TIMING_CONFIG)
    } else if (diffX > 0 && positionX.value * -1 > minX) {
      positionX.value = withTiming(-minX, PAN_WITH_TIMING_CONFIG)
    } else {
      positionX.value = withDecay({
        clamp: diffX > 0 ? [-minX, maxX] : [minX, maxX],
        rubberBandEffect: !isAndroid,
        rubberBandFactor: 0.5 * scale.value,
        velocity: (e.velocityX * 1.5) / scale.value,
        velocityFactor: 0.5 * scale.value,
      })
    }

    if (scaledDimensions.value.height <= screenDimensions.height) {
      positionY.value = withTiming(center.value.y, PAN_WITH_TIMING_CONFIG)
    } else if (positionY.value > maxY) {
      positionY.value = withTiming(maxY, PAN_WITH_TIMING_CONFIG)
    } else if (diffY <= 0 && positionY.value < minY) {
      positionY.value = withTiming(minY, PAN_WITH_TIMING_CONFIG)
    } else if (diffY > 0 && positionY.value * -1 > minY) {
      positionY.value = withTiming(-minY, PAN_WITH_TIMING_CONFIG)
    } else {
      positionY.value = withDecay({
        clamp: diffY > 0 ? [-minY, maxY] : [minY, maxY],
        rubberBandEffect: !isAndroid,
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
    backgroundOpacity.value =
      1 - Math.abs(e.translationY) / screenDimensions.height
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
      clamp: [-screenDimensions.height, screenDimensions.height],
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
  const tapGestures = Gesture.Simultaneous(doubleTapGesture, tapGesture)
  const pinchAndPanGestures = Gesture.Simultaneous(pinchGesture, panGesture)
  const allGestures = Gesture.Race(
    closeGesture,
    tapGestures,
    IS_WEB ? panGesture : pinchAndPanGestures,
  ) // Close gesture should have priority over the other gestures, and only one should run at a time

  const positionStyle = useAnimatedStyle(() => ({
    transform: [{translateX: positionX.value}, {translateY: positionY.value}],
  }))
  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
      height: animatedHeight.value,
      width: animatedWidth.value,
    }
  })

  return (
    <GestureDetector gesture={allGestures}>
      <View style={[styles.container]}>
        <Animated.View style={[positionStyle]}>
          <Animated.View style={[imageStyle]}>
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

const calculateDimensions = (
  startDimensions: {height: number; width: number},
  screenDimensions: {height: number; width: number},
  scale: number,
) => {
  'worklet'
  const imageAspect = startDimensions.width / startDimensions.height
  const screenAspect = screenDimensions.width / screenDimensions.height
  const isLandscape = imageAspect > screenAspect
  if (isLandscape) {
    return {
      width: scale * screenDimensions.width,
      height: (scale * screenDimensions.width) / imageAspect,
    }
  } else {
    return {
      width: scale * screenDimensions.height * imageAspect,
      height: scale * screenDimensions.height,
    }
  }
}

// Wrap this in gestureHandlerRootHOC since Android requires it when using gestures in a modal
export default React.memo(ImageViewerItem)
