import React, {useState} from 'react'
import {ActivityIndicator, Dimensions, StyleSheet} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {Image} from 'expo-image'

import type {Dimensions as ImageDimensions, ImageSource} from '../../@types'
import useImageDimensions from '../../hooks/useImageDimensions'
import {
  applyRounding,
  createTransform,
  prependPan,
  prependPinch,
  prependTransform,
  readTransform,
  TransformMatrix,
} from '../../transforms'

const windowDim = Dimensions.get('window')
const screenDim = Dimensions.get('screen')
const statusBarHeight = windowDim.height - screenDim.height
const SCREEN = {
  width: windowDim.width,
  height: windowDim.height + statusBarHeight,
}
const MIN_DOUBLE_TAP_SCALE = 2
const MAX_ORIGINAL_IMAGE_ZOOM = 2

const AnimatedImage = Animated.createAnimatedComponent(Image)
const initialTransform = createTransform()

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (isZoomed: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
}
const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  isScrollViewBeingDragged,
}: Props) => {
  const [isScaled, setIsScaled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imageDimensions = useImageDimensions(imageSrc)
  const committedTransform = useSharedValue(initialTransform)
  const panTranslation = useSharedValue({x: 0, y: 0})
  const pinchOrigin = useSharedValue({x: 0, y: 0})
  const pinchScale = useSharedValue(1)
  const pinchTranslation = useSharedValue({x: 0, y: 0})
  const dismissSwipeTranslateY = useSharedValue(0)
  const containerRef = useAnimatedRef()

  // Keep track of when we're entering or leaving scaled rendering.
  // Note: DO NOT move any logic reading animated values outside this function.
  useAnimatedReaction(
    () => {
      if (pinchScale.value !== 1) {
        // We're currently pinching.
        return true
      }
      const [, , committedScale] = readTransform(committedTransform.value)
      if (committedScale !== 1) {
        // We started from a pinched in state.
        return true
      }
      // We're at rest.
      return false
    },
    (nextIsScaled, prevIsScaled) => {
      if (nextIsScaled !== prevIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
    },
  )

  function handleZoom(nextIsScaled: boolean) {
    setIsScaled(nextIsScaled)
    onZoom(nextIsScaled)
  }

  const animatedStyle = useAnimatedStyle(() => {
    // Apply the active adjustments on top of the committed transform before the gestures.
    // This is matrix multiplication, so operations are applied in the reverse order.
    let t = createTransform()
    prependPan(t, panTranslation.value)
    prependPinch(t, pinchScale.value, pinchOrigin.value, pinchTranslation.value)
    prependTransform(t, committedTransform.value)
    const [translateX, translateY, scale] = readTransform(t)

    const dismissDistance = dismissSwipeTranslateY.value
    const dismissProgress = Math.min(
      Math.abs(dismissDistance) / (SCREEN.height / 2),
      1,
    )
    return {
      opacity: 1 - dismissProgress,
      transform: [
        {translateX},
        {translateY: translateY + dismissDistance},
        {scale},
      ],
    }
  })

  // On Android, stock apps prevent going "out of bounds" on pan or pinch. You should "bump" into edges.
  // If the user tried to pan too hard, this function will provide the negative panning to stay in bounds.
  function getExtraTranslationToStayInBounds(
    candidateTransform: TransformMatrix,
  ) {
    'worklet'
    if (!imageDimensions) {
      return [0, 0]
    }
    const [nextTranslateX, nextTranslateY, nextScale] =
      readTransform(candidateTransform)
    const scaledDimensions = getScaledDimensions(imageDimensions, nextScale)
    const clampedTranslateX = clampTranslation(
      nextTranslateX,
      scaledDimensions.width,
      SCREEN.width,
    )
    const clampedTranslateY = clampTranslation(
      nextTranslateY,
      scaledDimensions.height,
      SCREEN.height,
    )
    const dx = clampedTranslateX - nextTranslateX
    const dy = clampedTranslateY - nextTranslateY
    return [dx, dy]
  }

  const pinch = Gesture.Pinch()
    .onStart(e => {
      pinchOrigin.value = {
        x: e.focalX - SCREEN.width / 2,
        y: e.focalY - SCREEN.height / 2,
      }
    })
    .onChange(e => {
      if (!imageDimensions) {
        return
      }
      // Don't let the picture zoom in so close that it gets blurry.
      // Also, like in stock Android apps, don't let the user zoom out further than 1:1.
      const [, , committedScale] = readTransform(committedTransform.value)
      const maxCommittedScale =
        (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
      const minPinchScale = 1 / committedScale
      const maxPinchScale = maxCommittedScale / committedScale
      const nextPinchScale = Math.min(
        Math.max(minPinchScale, e.scale),
        maxPinchScale,
      )
      pinchScale.value = nextPinchScale

      // Zooming out close to the corner could push us out of bounds, which we don't want on Android.
      // Calculate where we'll end up so we know how much to translate back to stay in bounds.
      const t = createTransform()
      prependPan(t, panTranslation.value)
      prependPinch(t, nextPinchScale, pinchOrigin.value, pinchTranslation.value)
      prependTransform(t, committedTransform.value)
      const [dx, dy] = getExtraTranslationToStayInBounds(t)
      if (dx !== 0 || dy !== 0) {
        pinchTranslation.value = {
          x: pinchTranslation.value.x + dx,
          y: pinchTranslation.value.y + dy,
        }
      }
    })
    .onEnd(() => {
      // Commit just the pinch.
      let t = createTransform()
      prependPinch(
        t,
        pinchScale.value,
        pinchOrigin.value,
        pinchTranslation.value,
      )
      prependTransform(t, committedTransform.value)
      applyRounding(t)
      committedTransform.value = t

      // Reset just the pinch.
      pinchScale.value = 1
      pinchOrigin.value = {x: 0, y: 0}
      pinchTranslation.value = {x: 0, y: 0}
    })

  const pan = Gesture.Pan()
    .averageTouches(true)
    // Unlike .enabled(isScaled), this ensures that an initial pinch can turn into a pan midway:
    .minPointers(isScaled ? 1 : 2)
    .onChange(e => {
      if (!imageDimensions) {
        return
      }
      const nextPanTranslation = {x: e.translationX, y: e.translationY}
      let t = createTransform()
      prependPan(t, nextPanTranslation)
      prependPinch(
        t,
        pinchScale.value,
        pinchOrigin.value,
        pinchTranslation.value,
      )
      prependTransform(t, committedTransform.value)

      // Prevent panning from going out of bounds.
      const [dx, dy] = getExtraTranslationToStayInBounds(t)
      nextPanTranslation.x += dx
      nextPanTranslation.y += dy
      panTranslation.value = nextPanTranslation
    })
    .onEnd(() => {
      // Commit just the pan.
      let t = createTransform()
      prependPan(t, panTranslation.value)
      prependTransform(t, committedTransform.value)
      applyRounding(t)
      committedTransform.value = t

      // Reset just the pan.
      panTranslation.value = {x: 0, y: 0}
    })

  const singleTap = Gesture.Tap().onEnd(() => {
    runOnJS(onTap)()
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(e => {
      if (!imageDimensions) {
        return
      }
      const [, , committedScale] = readTransform(committedTransform.value)
      if (committedScale !== 1) {
        // Go back to 1:1 using the identity vector.
        let t = createTransform()
        committedTransform.value = withClampedSpring(t)
        return
      }

      // Try to zoom in so that we get rid of the black bars (whatever the orientation was).
      const imageAspect = imageDimensions.width / imageDimensions.height
      const screenAspect = SCREEN.width / SCREEN.height
      const candidateScale = Math.max(
        imageAspect / screenAspect,
        screenAspect / imageAspect,
        MIN_DOUBLE_TAP_SCALE,
      )
      // But don't zoom in so close that the picture gets blurry.
      const maxScale =
        (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
      const scale = Math.min(candidateScale, maxScale)

      // Calculate where we would be if the user pinched into the double tapped point.
      // We won't use this transform directly because it may go out of bounds.
      const candidateTransform = createTransform()
      const origin = {
        x: e.absoluteX - SCREEN.width / 2,
        y: e.absoluteY - SCREEN.height / 2,
      }
      prependPinch(candidateTransform, scale, origin, {x: 0, y: 0})

      // Now we know how much we went out of bounds, so we can shoot correctly.
      const [dx, dy] = getExtraTranslationToStayInBounds(candidateTransform)
      const finalTransform = createTransform()
      prependPinch(finalTransform, scale, origin, {x: dx, y: dy})
      committedTransform.value = withClampedSpring(finalTransform)
    })

  const dismissSwipePan = Gesture.Pan()
    .enabled(!isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate(e => {
      dismissSwipeTranslateY.value = e.translationY
    })
    .onEnd(e => {
      if (Math.abs(e.velocityY) > 1000) {
        dismissSwipeTranslateY.value = withDecay({velocity: e.velocityY})
        runOnJS(onRequestClose)()
      } else {
        dismissSwipeTranslateY.value = withSpring(0, {
          stiffness: 700,
          damping: 50,
        })
      }
    })

  const composedGesture = isScrollViewBeingDragged
    ? // If the parent is not at rest, provide a no-op gesture.
      Gesture.Manual()
    : Gesture.Exclusive(
        dismissSwipePan,
        Gesture.Simultaneous(pinch, pan),
        doubleTap,
        singleTap,
      )

  const isLoading = !isLoaded || !imageDimensions
  return (
    <Animated.View ref={containerRef} style={styles.container}>
      {isLoading && (
        <ActivityIndicator size="small" color="#FFF" style={styles.loading} />
      )}
      <GestureDetector gesture={composedGesture}>
        <AnimatedImage
          contentFit="contain"
          source={{uri: imageSrc.uri}}
          style={[styles.image, animatedStyle]}
          accessibilityLabel={imageSrc.alt}
          accessibilityHint=""
          onLoad={() => setIsLoaded(true)}
          cachePolicy="memory"
        />
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN.width,
    height: SCREEN.height,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
})

function getScaledDimensions(
  imageDimensions: ImageDimensions,
  scale: number,
): ImageDimensions {
  'worklet'
  const imageAspect = imageDimensions.width / imageDimensions.height
  const screenAspect = SCREEN.width / SCREEN.height
  const isLandscape = imageAspect > screenAspect
  if (isLandscape) {
    return {
      width: scale * SCREEN.width,
      height: (scale * SCREEN.width) / imageAspect,
    }
  } else {
    return {
      width: scale * SCREEN.height * imageAspect,
      height: scale * SCREEN.height,
    }
  }
}

function clampTranslation(
  value: number,
  scaledSize: number,
  screenSize: number,
): number {
  'worklet'
  // Figure out how much the user should be allowed to pan, and constrain the translation.
  const panDistance = Math.max(0, (scaledSize - screenSize) / 2)
  const clampedValue = Math.min(Math.max(-panDistance, value), panDistance)
  return clampedValue
}

function withClampedSpring(value: any) {
  'worklet'
  return withSpring(value, {overshootClamping: true})
}

export default React.memo(ImageItem)
