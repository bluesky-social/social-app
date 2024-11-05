/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  AnimatedRef,
  interpolate,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {Image} from 'expo-image'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useImageDimensions} from '#/lib/media/image-sizes'
import {ImageSource} from '../../@types'

const SWIPE_CLOSE_OFFSET = 75
const SWIPE_CLOSE_VELOCITY = 1
const MAX_ORIGINAL_IMAGE_ZOOM = 2
const MIN_DOUBLE_TAP_SCALE = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
  safeAreaRef: AnimatedRef<View>
}

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  showControls,
  safeAreaRef,
}: Props) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()
  const translationY = useSharedValue(0)
  const [scaled, setScaled] = useState(false)
  const screenSizeDelayedForJSThreadOnly = useSafeAreaFrame()
  const [imageAspect, imageDimensions] = useImageDimensions({
    src: imageSrc.uri,
    knownDimensions: imageSrc.dimensions,
  })
  const maxZoomScale = imageDimensions
    ? (imageDimensions.width / screenSizeDelayedForJSThreadOnly.width) *
      MAX_ORIGINAL_IMAGE_ZOOM
    : 1

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translationY.value,
        [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
        [0.5, 1, 0.5],
      ),
    }
  })

  const scrollHandler = useAnimatedScrollHandler({
    onScroll(e) {
      const nextIsScaled = e.zoomScale > 1
      translationY.value = nextIsScaled ? 0 : e.contentOffset.y
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
    },
    onEndDrag(e) {
      const velocityY = e.velocity?.y ?? 0
      const nextIsScaled = e.zoomScale > 1
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
      if (!nextIsScaled && Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY) {
        runOnJS(onRequestClose)()
      }
    },
  })

  function handleZoom(nextIsScaled: boolean) {
    onZoom(nextIsScaled)
    setScaled(nextIsScaled)
  }

  function zoomTo(nextZoomRect: {
    x: number
    y: number
    width: number
    height: number
  }) {
    const scrollResponderRef = scrollViewRef?.current?.getScrollResponder()
    // @ts-ignore
    scrollResponderRef?.scrollResponderZoomTo({
      ...nextZoomRect, // This rect is in screen coordinates
      animated: true,
    })
  }

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet'
    runOnJS(onTap)()
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(e => {
      'worklet'
      const screenSize = measure(safeAreaRef)
      if (!screenSize) {
        return
      }
      const {absoluteX, absoluteY} = e
      let nextZoomRect = {
        x: 0,
        y: 0,
        width: screenSize.width,
        height: screenSize.height,
      }
      const willZoom = !scaled
      if (willZoom) {
        nextZoomRect = getZoomRectAfterDoubleTap(
          imageAspect,
          absoluteX,
          absoluteY,
          screenSize,
        )
      }
      runOnJS(zoomTo)(nextZoomRect)
    })

  const composedGesture = Gesture.Exclusive(doubleTap, singleTap)

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.ScrollView
        // @ts-ignore Something's up with the types here
        ref={scrollViewRef}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxZoomScale}
        onScroll={scrollHandler}>
        <Animated.View
          style={[
            {
              // TODO: See if we can rely on native layout.
              height: screenSizeDelayedForJSThreadOnly.height,
            },
            animatedStyle,
          ]}>
          <ActivityIndicator size="small" color="#FFF" style={styles.loading} />
          <Image
            contentFit="contain"
            source={{uri: imageSrc.uri}}
            placeholderContentFit="contain"
            placeholder={{uri: imageSrc.thumbUri}}
            style={styles.image}
            accessibilityLabel={imageSrc.alt}
            accessibilityHint=""
            enableLiveTextInteraction={showControls && !scaled}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </Animated.ScrollView>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    flex: 1,
  },
})

const getZoomRectAfterDoubleTap = (
  imageAspect: number | undefined,
  touchX: number,
  touchY: number,
  screenSize: {width: number; height: number},
): {
  x: number
  y: number
  width: number
  height: number
} => {
  'worklet'
  if (!imageAspect) {
    return {
      x: 0,
      y: 0,
      width: screenSize.width,
      height: screenSize.height,
    }
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
  const screenAspect = screenSize.width / screenSize.height
  const zoom = Math.max(
    imageAspect / screenAspect,
    screenAspect / imageAspect,
    MIN_DOUBLE_TAP_SCALE,
  )
  // Unlike in the Android version, we don't constrain the *max* zoom level here.
  // Instead, this is done in the ScrollView props so that it constraints pinch too.

  // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
  // We already know the zoom level, so this gives us the rectangle size.
  let rectWidth = screenSize.width / zoom
  let rectHeight = screenSize.height / zoom

  // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
  // We don't want to introduce new black bars or make existing black bars unbalanced.
  let minX = 0
  let minY = 0
  let maxX = screenSize.width - rectWidth
  let maxY = screenSize.height - rectHeight
  if (imageAspect >= screenAspect) {
    // The image has horizontal black bars. Exclude them from the safe area.
    const renderedHeight = screenSize.width / imageAspect
    const horizontalBarHeight = (screenSize.height - renderedHeight) / 2
    minY += horizontalBarHeight
    maxY -= horizontalBarHeight
  } else {
    // The image has vertical black bars. Exclude them from the safe area.
    const renderedWidth = screenSize.height * imageAspect
    const verticalBarWidth = (screenSize.width - renderedWidth) / 2
    minX += verticalBarWidth
    maxX -= verticalBarWidth
  }

  // Finally, we can position the rect according to its size and the safe area.
  let rectX
  if (maxX >= minX) {
    // Content fills the screen horizontally so we have horizontal wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectX = touchX - touchX / zoom
    rectX = Math.min(rectX, maxX)
    rectX = Math.max(rectX, minX)
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectX = screenSize.width / 2 - rectWidth / 2
  }
  let rectY
  if (maxY >= minY) {
    // Content fills the screen vertically so we have vertical wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectY = touchY - touchY / zoom
    rectY = Math.min(rectY, maxY)
    rectY = Math.max(rectY, minY)
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectY = screenSize.height / 2 - rectHeight / 2
  }

  return {
    x: rectX,
    y: rectY,
    height: rectHeight,
    width: rectWidth,
  }
}

export default React.memo(ImageItem)
