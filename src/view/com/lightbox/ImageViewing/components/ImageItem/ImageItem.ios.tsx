/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useState} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  StyleProp,
  StyleSheet,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  PanGesture,
} from 'react-native-gesture-handler'
import Animated, {runOnJS, useAnimatedRef} from 'react-native-reanimated'
import {Image, ImageStyle} from 'expo-image'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useImageDimensions} from '#/lib/media/image-sizes'
import {ImageSource} from '../../@types'

const AnimatedImage = Animated.createAnimatedComponent(Image)

const SCREEN = Dimensions.get('screen')
const MAX_ORIGINAL_IMAGE_ZOOM = 2
const MIN_DOUBLE_TAP_SCALE = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isPagingAndroid: boolean // Not available on iOS
  showControls: boolean
  dismissSwipePan: PanGesture | null
  imageStyle: StyleProp<ImageStyle>
}

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  showControls,
  dismissSwipePan,
  imageStyle,
}: Props) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()

  const [scaled, setScaled] = useState(false)
  const [imageAspect, imageDimensions] = useImageDimensions({
    src: imageSrc.uri,
    knownDimensions: imageSrc.dimensions,
  })
  const maxZoomScale = imageDimensions
    ? (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
    : 1

  const scrollHandler = useAnimatedScrollHandler({
    onScroll(e) {
      const nextIsScaled = e.zoomScale > 1
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
    },
    onEndDrag(e) {
      const nextIsScaled = e.zoomScale > 1
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
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
        imageAspect,
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

  function handleTap() {
    if (scaled) {
      const scrollResponderRef = scrollViewRef?.current?.getScrollResponder()
      // @ts-ignore
      scrollResponderRef?.scrollResponderZoomTo({
        x: 0,
        y: 0,
        width: SCREEN.width,
        height: SCREEN.height,
        animated: true,
      })
    } else {
      onTap()
    }
  }

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet'
    runOnJS(handleTap)()
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(e => {
      'worklet'
      const {absoluteX, absoluteY} = e
      runOnJS(handleDoubleTap)(absoluteX, absoluteY)
    })

  const composedGesture = Gesture.Exclusive(
    dismissSwipePan ?? Gesture.Manual(),
    doubleTap,
    singleTap,
  )

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.ScrollView
        // @ts-ignore Something's up with the types here
        ref={scrollViewRef}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxZoomScale}
        onScroll={scrollHandler}
        bounces={scaled}
        centerContent>
        <ActivityIndicator size="small" color="#FFF" style={styles.loading} />
        <AnimatedImage
          contentFit="cover"
          source={{uri: imageSrc.uri}}
          placeholderContentFit="cover"
          placeholder={{uri: imageSrc.thumbUri}}
          style={[
            {
              width: SCREEN.width,
              height: imageAspect ? SCREEN.width / imageAspect : undefined,
              borderRadius:
                imageSrc.type === 'circle-avi'
                  ? SCREEN.width / 2
                  : imageSrc.type === 'rect-avi'
                  ? 20
                  : 0,
            },
            imageStyle,
          ]}
          accessibilityLabel={imageSrc.alt}
          accessibilityHint=""
          enableLiveTextInteraction={showControls && !scaled}
          accessibilityIgnoresInvertColors
        />
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
})

const getZoomRectAfterDoubleTap = (
  imageAspect: number | undefined,
  touchX: number,
  touchY: number,
): {
  x: number
  y: number
  width: number
  height: number
} => {
  if (!imageAspect) {
    return {
      x: 0,
      y: 0,
      width: SCREEN.width,
      height: SCREEN.height,
    }
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
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
