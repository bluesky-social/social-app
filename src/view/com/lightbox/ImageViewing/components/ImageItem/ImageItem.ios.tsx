/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useState} from 'react'
import {ActivityIndicator, Dimensions, StyleSheet} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {Image} from 'expo-image'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {Dimensions as ImageDimensions, ImageSource} from '../../@types'
import useImageDimensions from '../../hooks/useImageDimensions'

const SWIPE_CLOSE_OFFSET = 75
const SWIPE_CLOSE_VELOCITY = 1
const SCREEN = Dimensions.get('screen')
const MAX_ORIGINAL_IMAGE_ZOOM = 2
const MIN_DOUBLE_TAP_SCALE = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
}

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  showControls,
}: Props) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()
  const translationY = useSharedValue(0)
  const [scaled, setScaled] = useState(false)
  const imageDimensions = useImageDimensions(imageSrc)
  const maxZoomScale = imageDimensions
    ? (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
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

  function handleDoubleTap(absoluteX: number, absoluteY: number) {
    const scrollResponderRef = scrollViewRef?.current?.getScrollResponder()
    let nextZoomRect = {
      x: 0,
      y: 0,
      width: SCREEN.width,
      height: SCREEN.height,
    }

    const willZoom = !scaled
    if (willZoom) {
      nextZoomRect = getZoomRectAfterDoubleTap(
        imageDimensions,
        absoluteX,
        absoluteY,
      )
    }

    // @ts-ignore
    scrollResponderRef?.scrollResponderZoomTo({
      ...nextZoomRect, // This rect is in screen coordinates
      animated: true,
    })
  }

  const singleTap = Gesture.Tap().onEnd(() => {
    runOnJS(onTap)()
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(e => {
      const {absoluteX, absoluteY} = e
      runOnJS(handleDoubleTap)(absoluteX, absoluteY)
    })

  const composedGesture = Gesture.Exclusive(doubleTap, singleTap)

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.ScrollView
        // @ts-ignore Something's up with the types here
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxZoomScale}
        onScroll={scrollHandler}>
        <Animated.View style={[styles.imageScrollContainer, animatedStyle]}>
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
  imageScrollContainer: {
    height: SCREEN.height,
  },
  listItem: {
    width: SCREEN.width,
    height: SCREEN.height,
  },
  image: {
    width: SCREEN.width,
    height: SCREEN.height,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

const getZoomRectAfterDoubleTap = (
  imageDimensions: ImageDimensions | null,
  touchX: number,
  touchY: number,
): {
  x: number
  y: number
  width: number
  height: number
} => {
  if (!imageDimensions) {
    return {
      x: 0,
      y: 0,
      width: SCREEN.width,
      height: SCREEN.height,
    }
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
  const imageAspect = imageDimensions.width / imageDimensions.height
  const screenAspect = SCREEN.width / SCREEN.height
  const zoom = Math.max(
    imageAspect / screenAspect,
    screenAspect / imageAspect,
    MIN_DOUBLE_TAP_SCALE,
  )
  // Unlike in the Android version, we don't constrain the *max* zoom level here.
  // Instead, this is done in the ScrollView props so that it constraints pinch too.

  // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
  // We already know the zoom level, so this gives us the rectangle size.
  let rectWidth = SCREEN.width / zoom
  let rectHeight = SCREEN.height / zoom

  // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
  // We don't want to introduce new black bars or make existing black bars unbalanced.
  let minX = 0
  let minY = 0
  let maxX = SCREEN.width - rectWidth
  let maxY = SCREEN.height - rectHeight
  if (imageAspect >= screenAspect) {
    // The image has horizontal black bars. Exclude them from the safe area.
    const renderedHeight = SCREEN.width / imageAspect
    const horizontalBarHeight = (SCREEN.height - renderedHeight) / 2
    minY += horizontalBarHeight
    maxY -= horizontalBarHeight
  } else {
    // The image has vertical black bars. Exclude them from the safe area.
    const renderedWidth = SCREEN.height * imageAspect
    const verticalBarWidth = (SCREEN.width - renderedWidth) / 2
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
    rectX = SCREEN.width / 2 - rectWidth / 2
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
    rectY = SCREEN.height / 2 - rectHeight / 2
  }

  return {
    x: rectX,
    y: rectY,
    height: rectHeight,
    width: rectWidth,
  }
}

export default React.memo(ImageItem)
