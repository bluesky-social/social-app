/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useCallback, useRef, useState} from 'react'

import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableWithoutFeedback,
} from 'react-native'
import {Image} from 'expo-image'

import useDoubleTapToZoom from '../../hooks/useDoubleTapToZoom'
import useImageDimensions from '../../hooks/useImageDimensions'

import {getImageStyles, getImageTransform} from '../../utils'
import {ImageSource} from '../../@types'
import {ImageLoading} from './ImageLoading'

const SWIPE_CLOSE_OFFSET = 75
const SWIPE_CLOSE_VELOCITY = 1
const SCREEN = Dimensions.get('screen')
const SCREEN_WIDTH = SCREEN.width
const SCREEN_HEIGHT = SCREEN.height
const MAX_SCALE = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onZoom: (scaled: boolean) => void
}

const AnimatedImage = Animated.createAnimatedComponent(Image)

const ImageItem = ({imageSrc, onZoom, onRequestClose}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const [loaded, setLoaded] = useState(false)
  const [scaled, setScaled] = useState(false)
  const imageDimensions = useImageDimensions(imageSrc)
  const handleDoubleTap = useDoubleTapToZoom(
    scrollViewRef,
    scaled,
    SCREEN,
    imageDimensions,
  )

  const [translate, scale] = getImageTransform(imageDimensions, SCREEN)
  const scrollValueY = new Animated.Value(0)
  const scaleValue = new Animated.Value(scale || 1)
  const translateValue = new Animated.ValueXY(translate)
  const maxScrollViewZoom = MAX_SCALE / (scale || 1)

  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  })
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue,
  )
  const imageStylesWithOpacity = {...imagesStyles, opacity: imageOpacity}

  const onScrollEndDrag = useCallback(
    ({nativeEvent}: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0
      const currentScaled = nativeEvent?.zoomScale > 1

      onZoom(currentScaled)
      setScaled(currentScaled)

      if (!currentScaled && Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY) {
        onRequestClose()
      }
    },
    [onRequestClose, onZoom],
  )

  const onScroll = ({nativeEvent}: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0

    if (nativeEvent?.zoomScale > 1) {
      return
    }

    scrollValueY.setValue(offsetY)
  }

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScrollViewZoom}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={true}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}>
        {(!loaded || !imageDimensions) && <ImageLoading />}
        <TouchableWithoutFeedback
          onPress={handleDoubleTap}
          accessibilityRole="image"
          accessibilityLabel={imageSrc.alt}
          accessibilityHint="">
          <AnimatedImage
            source={imageSrc}
            style={imageStylesWithOpacity}
            onLoad={() => setLoaded(true)}
          />
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
})

export default React.memo(ImageItem)
