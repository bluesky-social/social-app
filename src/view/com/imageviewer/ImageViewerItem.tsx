import React from 'react'
import {Dimensions, Platform, StyleSheet} from 'react-native'
import Animated, {
  MeasuredDimensions,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {
  Gesture,
  GestureDetector,
  gestureHandlerRootHOC,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'

/**
 * Ground Rules!
 *
 * Images in the feed are thumbnails (low quality :( ) so we need to display the *pretty* images in the viewer.
 * To account for that, we will do the following:
 * 1. Image is pressed on feed
 * 2. Full screen preload begins
 * 3. Thumbnail animates to full size
 * 4. Once the animation completes, we either:
 *  a. Display the full size image if it has already loaded (before removing the thumbnail! We don't want a flicker)
 *  b. Continue waiting for the prefetch to complete then display it. We could just display the new image right away,
 *     but that would be an additional request that is pointless.
 *  5. Once we prefetch the first image, the rest of the images in the set (if any) should be prefetched in anticipation
 *  of scrolling
 *
 *  Paging:
 *  We need to have two image components so that we can swipe images in and out of the viewer. All of the gestures will
 *  be ran on the main image.
 *
 *  Once the animation completes, then we will update the state to set the current image to the next image in the set.
 */

const AnimatedImage = Animated.createAnimatedComponent(Image)

const IS_WEB = Platform.OS === 'web'
const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window')
const WITH_TIMING_CONFIG = {
  duration: 300,
}

const MAX_SCALE = 3

const getViewerDimensions = (image?: ViewImage) => {
  if (!image) return undefined

  const {height, width} = image.aspectRatio! // TODO figure out if this is ever not set (i believe it can be)
  if (height === 0 || width === 0) return {height: 200, width: 200}

  const heightModifier = !IS_WEB ? 0.9 : 1

  const heightRatio = (SCREEN_HEIGHT * heightModifier) / height
  const widthRatio = SCREEN_WIDTH / width

  const ratio = Math.min(widthRatio, heightRatio)

  return {
    height: Math.round(height * ratio),
    width: Math.round(width * ratio),
  }
}

interface IProps {
  image: ViewImage
  measurement?: MeasuredDimensions
  index: number
  initialIndex: number
  isVisible: boolean
  setIsScaled: React.Dispatch<React.SetStateAction<boolean>>
  setAccessoriesVisible: React.Dispatch<React.SetStateAction<boolean>>
  opacity: SharedValue<number>
  accessoryOpacity: SharedValue<number>
  backgroundOpacity: SharedValue<number>
}

function ImageViewerItemInner({
  image,
  measurement,
  index,
  initialIndex,
  isVisible,
  setIsScaled,
  setAccessoriesVisible,
  opacity,
  accessoryOpacity,
  backgroundOpacity,
}: IProps) {
  const viewerDimensions = React.useMemo(
    () => getViewerDimensions(image),
    [image],
  )

  // Use this to enable/disable the pan gesture
  const [panGestureEnabled, setPanGestureEnabled] = React.useState(false)

  const positionX = useSharedValue(0)
  const positionY = useSharedValue(0)

  const lastTranslateX = useSharedValue(0)
  const lastTranslateY = useSharedValue(0)

  const height = useSharedValue(0)
  const width = useSharedValue(0)

  const scale = useSharedValue(1)
  const lastScale = useSharedValue(1)

  // Determine where the center should be
  const centerX = (SCREEN_WIDTH - viewerDimensions!.width) / 2
  const centerY = (SCREEN_HEIGHT - viewerDimensions!.height) / 2

  // Update isScaled when the scale changes
  useAnimatedReaction(
    () => scale.value,
    (curr, prev) => {
      if (curr === 1 && prev !== 1) {
        runOnJS(setIsScaled)(false)
        runOnJS(setPanGestureEnabled)(false)
      } else if (curr !== 1 && prev === 1) {
        runOnJS(setIsScaled)(true)
        runOnJS(setPanGestureEnabled)(true)
      }
    },
  )

  const centerImage = () => {
    'worklet'

    positionX.value = withTiming(centerX)
    positionY.value = withTiming(centerY)
  }

  // Handle opening the image viewer
  React.useEffect(() => {
    'worklet'

    // Reset the viewer when it closes
    if (!isVisible) return

    // For all images that are not the current image, set the dimensions
    if (index !== initialIndex) {
      height.value = viewerDimensions!.height
      width.value = viewerDimensions!.width
      centerImage()
      return
    }

    // Reset the opacity
    opacity.value = 1

    // Set the initial position of the image in the modal
    positionX.value = measurement!.pageX
    positionY.value = measurement!.pageY

    // Also set the initial height and width
    height.value = measurement!.height
    width.value = measurement!.width

    // Now set the new dimensions with timing
    height.value = withTiming(viewerDimensions!.height, WITH_TIMING_CONFIG)
    width.value = withTiming(viewerDimensions!.width, WITH_TIMING_CONFIG)

    // Center the image
    centerImage()

    // Fade in the background and show accessories
    backgroundOpacity.value = withTiming(1, WITH_TIMING_CONFIG)
    accessoryOpacity.value = withTiming(1, WITH_TIMING_CONFIG)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

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

  const onPanEnd = () => {
    'worklet'

    lastTranslateX.value = 0
    lastTranslateY.value = 0

    centerImage()
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

  // This doesn't need to be a worklet since we are just setting state which would run on js anyway
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
  const allGestures = Gesture.Simultaneous(tapGestures, pinchAndPanGestures)

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
      <Animated.View style={[styles.imageContainer]}>
        <Animated.View style={positionStyle}>
          {IS_WEB ? (
            <Animated.View style={[scaleStyle, dimensionsStyle]}>
              <Image
                source={{uri: image?.thumb}}
                style={{height: '100%', width: '100%'}}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          ) : (
            <AnimatedImage
              source={{uri: image?.thumb}}
              style={[viewerDimensions, scaleStyle, dimensionsStyle]}
              cachePolicy="memory-disk"
            />
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    height: '100%',
    width: '100%',
  },
})

// Wrap this in gestureHandlerRootHOC since Android requires it when using gestures in a modal
export const ImageViewerItem = React.memo(ImageViewerItemInner)
