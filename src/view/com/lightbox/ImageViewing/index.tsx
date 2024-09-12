/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {ComponentType, useCallback, useState} from 'react'
import {Dimensions, StyleSheet, View} from 'react-native'
import PagerView from 'react-native-pager-view'
import Animated, {
  interpolate,
  MeasuredDimensions,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image} from 'expo-image'

import {isAndroid} from '#/platform/detection'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'

const AnimatedImage = Animated.createAnimatedComponent(Image)

const SCREEN: {width: number; height: number} = Dimensions.get('screen')

type Props = {
  thumbDims?: MeasuredDimensions | null
  images: {
    uri: string
    thumbUri: string
    alt?: string
  }[]
  initialImageIndex: number
  visible: boolean
  onRequestClose: () => void
  onLoad: () => void
  backgroundColor?: string
  HeaderComponent?: ComponentType<{imageIndex: number}>
  FooterComponent?: ComponentType<{imageIndex: number}>
}

const DEFAULT_BG_COLOR = '#000'

function ImageViewing({
  images,
  initialImageIndex,
  onLoad,
  onRequestClose,
  backgroundColor = DEFAULT_BG_COLOR,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const [showControls, setShowControls] = useState(true)

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    pointerEvents: showControls ? 'auto' : 'none',
    opacity: withClampedSpring(showControls ? 1 : 0),
    transform: [
      {
        translateY: withClampedSpring(showControls ? 0 : -30),
      },
    ],
  }))
  const animatedFooterStyle = useAnimatedStyle(() => ({
    pointerEvents: showControls ? 'auto' : 'none',
    opacity: withClampedSpring(showControls ? 1 : 0),
    transform: [
      {
        translateY: withClampedSpring(showControls ? 0 : 30),
      },
    ],
  }))

  const onTap = useCallback(() => {
    setShowControls(show => !show)
  }, [])

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled)
    if (nextIsScaled) {
      setShowControls(false)
    }
  }, [])

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        {typeof HeaderComponent !== 'undefined' ? (
          React.createElement(HeaderComponent, {
            imageIndex,
          })
        ) : (
          <ImageDefaultHeader onRequestClose={onRequestClose} />
        )}
      </Animated.View>
      <PagerView
        scrollEnabled={!isScaled}
        initialPage={initialImageIndex}
        onPageSelected={e => {
          setImageIndex(e.nativeEvent.position)
          setIsScaled(false)
        }}
        onPageScrollStateChanged={e => {
          setIsDragging(e.nativeEvent.pageScrollState !== 'idle')
        }}
        overdrag={true}
        style={styles.pager}>
        {images.map(imageSrc => (
          <View key={imageSrc.uri}>
            <ImageItem
              onTap={onTap}
              onZoom={onZoom}
              onLoad={onLoad}
              imageSrc={imageSrc}
              onRequestClose={onRequestClose}
              isScrollViewBeingDragged={isDragging}
              showControls={showControls}
            />
          </View>
        ))}
      </PagerView>
      {typeof FooterComponent !== 'undefined' && (
        <Animated.View style={[styles.footer, animatedFooterStyle]}>
          {React.createElement(FooterComponent, {
            imageIndex,
          })}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    top: 0,
    pointerEvents: 'box-none',
  },
  footer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    bottom: 0,
  },
})

function ImageViewingWithSplash(props: Props) {
  const openProgress = useSharedValue(0)
  const [isAnimationDone, setIsAnimationDone] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const isReady = isAnimationDone && isLoaded
  const initialImage = props.images[props.initialImageIndex]

  React.useEffect(() => {
    openProgress.value = withClampedSpring(1)
  }, [openProgress])

  useAnimatedReaction(
    () => openProgress.value,
    nextValue => {
      if (nextValue === 1) {
        runOnJS(setIsAnimationDone)(true)
      }
    },
  )

  const initialTransform = calculateOverlayTransform(SCREEN, props.thumbDims)
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
  }))
  const animatedStyle = useAnimatedStyle(() => {
    if (!initialTransform) {
      return {}
    }
    return {
      transform: [
        {
          scale: interpolate(
            openProgress.value,
            [0, 1],
            [initialTransform.scale, 1],
          ),
        },
        {
          translateX: interpolate(
            openProgress.value,
            [0, 1],
            [initialTransform.translateX, 0],
          ),
        },
        {
          translateY: interpolate(
            openProgress.value,
            [0, 1],
            [initialTransform.translateY, 0],
          ),
        },
      ],
    }
  })
  const insets = useSafeAreaInsets()

  if (!props.visible) {
    return null
  }

  const showSplash = initialTransform && !isReady
  return (
    <View
      aria-modal
      accessibilityViewIsModal
      style={{
        position: 'absolute',
        top: isAndroid ? insets.top : 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}>
      {showSplash && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              zIndex: 1,
              pointerEvents: 'none',
            },
          ]}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                backgroundColor: 'black',
              },
              backgroundStyle,
            ]}
          />
          <AnimatedImage
            contentFit="contain"
            source={{uri: initialImage.thumbUri}}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              },
              animatedStyle,
            ]}
          />
        </Animated.View>
      )}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: showSplash ? 'none' : 'auto',
          opacity: showSplash ? 0 : 1,
        }}>
        <ImageViewing
          key={props.initialImageIndex}
          {...props}
          onLoad={() => {
            setTimeout(() => {
              setIsLoaded(true)
            }, 200 /* give it time to render on screen, we don't have exact callback for this. */)
          }}
        />
      </Animated.View>
    </View>
  )
}

const calculateOverlayTransform = (
  screenSize: {width: number; height: number},
  thumbnailPlacement:
    | {
        pageX: number
        width: number
        pageY: number
        height: number
      }
    | null
    | undefined,
) => {
  if (!thumbnailPlacement) {
    return null
  }
  const scale = thumbnailPlacement.width / screenSize.width
  const screenCenterX = screenSize.width / 2
  const screenCenterY = screenSize.height / 2
  const thumbnailCenterX =
    thumbnailPlacement.pageX + thumbnailPlacement.width / 2
  const thumbnailCenterY =
    thumbnailPlacement.pageY + thumbnailPlacement.height / 2
  const translateX = (thumbnailCenterX - screenCenterX) / scale
  const translateY = (thumbnailCenterY - screenCenterY) / scale
  return {scale, translateX, translateY}
}

function withClampedSpring(value: any) {
  'worklet'
  return withSpring(value, {overshootClamping: true, stiffness: 300})
}

export default ImageViewingWithSplash
