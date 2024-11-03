/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {useCallback, useMemo, useState} from 'react'
import {
  Dimensions,
  LayoutAnimation,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import {Gesture, PanGesture} from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'
import {
  cancelAnimation,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Edge, SafeAreaView} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'

import {useImageDimensions} from '#/lib/media/image-sizes'
import {colors, s} from '#/lib/styles'
import {isAndroid, isIOS} from '#/platform/detection'
import {Lightbox} from '#/state/lightbox'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {PlatformInfo} from '../../../../../modules/expo-bluesky-swiss-army'
import {ImageSource} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'

const SCREEN = Dimensions.get('screen')
const PIXEL_RATIO = PixelRatio.get()
const SCREEN_HEIGHT = Dimensions.get('window').height

function ImageViewing({
  lightbox,
  openProgress,
  onFlyAway,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox
  openProgress: SharedValue<number>
  onFlyAway: () => void
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}) {
  const {images, index: initialImageIndex} = lightbox
  const [isScaled, setIsScaled] = useState(false)
  const [isPagingAndroid, setIsPagingAndroid] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const [showControls, setShowControls] = useState(true)
  const dismissSwipeTranslateY = useSharedValue(0)
  const isFlyingAway = useSharedValue(false)

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      pointerEvents: show ? 'auto' : 'none',
      opacity: withClampedSpring(show && openProgress.value === 1 ? 1 : 0),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : -30),
        },
      ],
    }
  })
  const animatedFooterStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      pointerEvents: show ? 'auto' : 'none',
      opacity: withClampedSpring(show && openProgress.value === 1 ? 1 : 0),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : 30),
        },
      ],
    }
  })

  const containerStyle = useAnimatedStyle(() => {
    if (openProgress.value < 1 || isFlyingAway.value) {
      return {pointerEvents: 'none'}
    }
    return {pointerEvents: 'auto'}
  })

  const dismissSwipePan = Gesture.Pan()
    .enabled(!isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate(e => {
      'worklet'
      dismissSwipeTranslateY.value = e.translationY
    })
    .onEnd(e => {
      'worklet'
      if (Math.abs(e.velocityY) > 1000) {
        isFlyingAway.value = true
        dismissSwipeTranslateY.value = withDecay({
          velocity: e.velocityY,
          velocityFactor: Math.max(3000 / Math.abs(e.velocityY), 1), // Speed up if it's too slow.
          deceleration: 1, // Danger! This relies on the reaction below stopping it.
        })
      } else {
        dismissSwipeTranslateY.value = withSpring(0, {
          stiffness: 700,
          damping: 50,
        })
      }
    })
  useAnimatedReaction(
    () => Math.abs(dismissSwipeTranslateY.value) > SCREEN_HEIGHT,
    (isOut, wasOut) => {
      if (isOut && !wasOut) {
        // Stop the animation from blocking the screen forever.
        cancelAnimation(dismissSwipeTranslateY)
        onFlyAway()
      }
    },
  )

  const onTap = useCallback(() => {
    setShowControls(show => !show)
  }, [])

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled)
    if (nextIsScaled) {
      setShowControls(false)
    }
  }, [])

  const edges = useMemo(() => {
    if (Platform.OS === 'android') {
      return ['top', 'bottom', 'left', 'right'] satisfies Edge[]
    }
    return ['left', 'right'] satisfies Edge[] // iOS, so no top/bottom safe area
  }, [])

  const backdropStyle = useAnimatedStyle(() => {
    let opacity
    if (openProgress.value < 1) {
      opacity = Math.sqrt(openProgress.value)
    } else {
      opacity =
        1 -
        Math.min(
          Math.abs(dismissSwipeTranslateY.value) / (SCREEN.height / 2),
          1,
        )
    }
    return {opacity}
  })

  return (
    <SafeAreaView
      style={styles.screen}
      edges={edges}
      aria-modal
      accessibilityViewIsModal>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <ImageDefaultHeader onRequestClose={onRequestClose} />
        </Animated.View>
        <PagerView
          scrollEnabled={!isScaled}
          initialPage={initialImageIndex}
          onPageSelected={e => {
            setImageIndex(e.nativeEvent.position)
            setIsScaled(false)
          }}
          onPageScrollStateChanged={e => {
            if (isAndroid) {
              // This condition isn't reliable on iOS (the pager may send
              // events out of order if you spam it with vertical pans in
              // the middle of deceleration). However, we only need this
              // variable for Android anyway, so let's make that explicit.
              setIsPagingAndroid(e.nativeEvent.pageScrollState !== 'idle')
            }
          }}
          overdrag={true}
          style={styles.pager}>
          {images.map((imageSrc, i) => (
            <LightboxPage
              key={imageSrc.uri}
              imageSrc={imageSrc}
              onRequestClose={onRequestClose}
              onTap={onTap}
              onZoom={onZoom}
              isActive={i === imageIndex}
              isPagingAndroid={isPagingAndroid}
              isFlyingAway={isFlyingAway}
              isScaled={isScaled}
              showControls={showControls}
              openProgress={openProgress}
              dismissSwipePan={dismissSwipePan}
              dismissSwipeTranslateY={dismissSwipeTranslateY}
            />
          ))}
        </PagerView>
        <Animated.View style={[styles.footer, animatedFooterStyle]}>
          <LightboxFooter
            images={images}
            index={imageIndex}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

function LightboxPage({
  imageSrc,
  onRequestClose,
  onTap,
  onZoom,
  isActive,
  isPagingAndroid,
  showControls,
  openProgress,
  dismissSwipeTranslateY,
  dismissSwipePan,
}: {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isActive: boolean
  isPagingAndroid: boolean
  isFlyingAway: SharedValue<boolean>
  isScaled: boolean
  showControls: boolean
  openProgress: SharedValue<number>
  dismissSwipeTranslateY: SharedValue<number>
  dismissSwipePan: PanGesture
}) {
  const {thumbRect, dimensions: knownDimensions, type} = imageSrc
  const [imageAspect, dimensions] = useImageDimensions({
    src: imageSrc.uri,
    knownDimensions,
  })

  const finalWidth = SCREEN.width
  const finalHeight = imageAspect ? SCREEN.width / imageAspect : undefined

  const interpolation = useDerivedValue(() => {
    if (isActive && thumbRect && knownDimensions && openProgress.value < 1) {
      return interpolateTransform(
        openProgress.value,
        thumbRect,
        SCREEN,
        knownDimensions,
      )
    }
    const translateY = isActive ? dismissSwipeTranslateY.value : 0
    return {
      transform: [{translateY}],
      width: finalWidth,
      height: finalHeight,
    }
  })

  const containerStyle = useAnimatedStyle(() => {
    const {transform} = interpolation.value
    return {
      flex: 1,
      transform,
    }
  })

  const imageStyle = useAnimatedStyle(() => {
    const {width, height} = interpolation.value
    return {
      width,
      height,
      borderRadius:
        type === 'circle-avi' ? SCREEN.width / 2 : type === 'rect-avi' ? 20 : 0,
    }
  })

  return (
    <Animated.View style={containerStyle}>
      <ImageItem
        onTap={onTap}
        onZoom={onZoom}
        imageSrc={imageSrc}
        onRequestClose={onRequestClose}
        isPagingAndroid={isPagingAndroid}
        showControls={showControls}
        dismissSwipePan={isActive ? dismissSwipePan : null}
        imageStyle={imageStyle}
        imageAspect={imageAspect}
        dimensions={dimensions}
      />
    </Animated.View>
  )
}

function LightboxFooter({
  images,
  index,
  onPressSave,
  onPressShare,
}: {
  images: ImageSource[]
  index: number
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}) {
  const {alt: altText, uri} = images[index]
  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const insets = useSafeAreaInsets()
  const svMaxHeight = SCREEN_HEIGHT - insets.top - 50
  const isMomentumScrolling = React.useRef(false)
  return (
    <ScrollView
      style={[
        {
          backgroundColor: '#000d',
        },
        {maxHeight: svMaxHeight},
      ]}
      scrollEnabled={isAltExpanded}
      onMomentumScrollBegin={() => {
        isMomentumScrolling.current = true
      }}
      onMomentumScrollEnd={() => {
        isMomentumScrolling.current = false
      }}
      contentContainerStyle={{
        paddingTop: 16,
        paddingBottom: insets.bottom + 10,
        paddingHorizontal: 24,
      }}>
      {altText ? (
        <View accessibilityRole="button" style={styles.footerText}>
          <Text
            style={[s.gray3]}
            numberOfLines={isAltExpanded ? undefined : 3}
            selectable
            onPress={() => {
              if (isMomentumScrolling.current) {
                return
              }
              LayoutAnimation.configureNext({
                duration: 450,
                update: {type: 'spring', springDamping: 1},
              })
              setAltExpanded(prev => !prev)
            }}
            onLongPress={() => {}}>
            {altText}
          </Text>
        </View>
      ) : null}
      <View style={styles.footerBtns}>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => onPressSave(uri)}>
          <FontAwesomeIcon icon={['far', 'floppy-disk']} style={s.white} />
          <Text type="xl" style={s.white}>
            <Trans context="action">Save</Trans>
          </Text>
        </Button>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => onPressShare(uri)}>
          <FontAwesomeIcon icon="arrow-up-from-bracket" style={s.white} />
          <Text type="xl" style={s.white}>
            <Trans context="action">Share</Trans>
          </Text>
        </Button>
      </View>
    </ScrollView>
  )
}

function interpolatePx(
  px: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
) {
  'worklet'
  const value = interpolate(px, inputRange, outputRange)
  return Math.round(value * PIXEL_RATIO) / PIXEL_RATIO
}

function interpolateTransform(
  progress: number,
  thumbnailDims: {
    pageX: number
    width: number
    pageY: number
    height: number
  },
  screenSize: {width: number; height: number},
  imageDims: {width: number; height: number},
) {
  'worklet'
  const imageAspect = imageDims.width / imageDims.height
  const thumbAspect = thumbnailDims.width / thumbnailDims.height
  let uncroppedInitialWidth
  let uncroppedInitialHeight
  if (imageAspect > thumbAspect) {
    uncroppedInitialWidth = thumbnailDims.height * imageAspect
    uncroppedInitialHeight = thumbnailDims.height
  } else {
    uncroppedInitialWidth = thumbnailDims.width
    uncroppedInitialHeight = thumbnailDims.width / imageAspect
  }
  const finalWidth = screenSize.width
  const finalHeight = screenSize.width / imageAspect
  const initialScale = Math.min(
    uncroppedInitialWidth / finalWidth,
    uncroppedInitialHeight / finalHeight,
  )
  const croppedFinalWidth = thumbnailDims.width / initialScale
  const croppedFinalHeight = thumbnailDims.height / initialScale
  const screenCenterX = screenSize.width / 2
  const screenCenterY = screenSize.height / 2
  const thumbnailCenterX = thumbnailDims.pageX + thumbnailDims.width / 2
  const thumbnailCenterY = thumbnailDims.pageY + thumbnailDims.height / 2
  const initialTranslateX = thumbnailCenterX - screenCenterX
  const initialTranslateY = thumbnailCenterY - screenCenterY
  const scale = interpolate(progress, [0, 1], [initialScale, 1])
  const translateX = interpolatePx(progress, [0, 1], [initialTranslateX, 0])
  const translateY = interpolatePx(progress, [0, 1], [initialTranslateY, 0])
  const width = interpolatePx(progress, [0, 1], [croppedFinalWidth, finalWidth])
  const height = interpolatePx(
    progress,
    [0, 1],
    [croppedFinalHeight, finalHeight],
  )
  const cropTranslateX = interpolatePx(
    progress,
    [0, 1],
    [(finalWidth - croppedFinalWidth) / 2, 0],
  )
  return {
    transform: [
      {translateX},
      {translateY},
      {scale},
      {translateX: cropTranslateX},
    ],
    width,
    height,
  }
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
  },
  backdrop: {
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
  footerText: {
    paddingBottom: isIOS ? 20 : 16,
  },
  footerBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderColor: colors.white,
  },
})

function ImageViewingRoot({
  lightbox: nextLightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox | null
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}) {
  const [activeLightbox, setActiveLightbox] = useState(nextLightbox)
  const openProgress = useSharedValue(0)

  if (!activeLightbox && nextLightbox) {
    setActiveLightbox(nextLightbox)
  }

  React.useEffect(() => {
    if (!nextLightbox) {
      return
    }
    const canAnimate =
      !PlatformInfo.getIsReducedMotionEnabled() &&
      nextLightbox.images.every(img => img.dimensions && img.thumbRect)
    if (canAnimate) {
      openProgress.value = withClampedSpring(1)
      return () => {
        openProgress.value = withClampedSpring(0)
      }
    } else {
      openProgress.value = 1
      return () => {
        openProgress.value = 0
      }
    }
  }, [nextLightbox, openProgress])

  useAnimatedReaction(
    () => openProgress.value === 0,
    (isGone, wasGone) => {
      if (isGone && !wasGone) {
        runOnJS(setActiveLightbox)(null)
      }
    },
  )

  if (!activeLightbox) {
    return null
  }

  return (
    <ImageViewing
      key={activeLightbox.id}
      lightbox={activeLightbox}
      openProgress={openProgress}
      onRequestClose={onRequestClose}
      onFlyAway={() => {
        'worklet'
        openProgress.value = 0
        runOnJS(onRequestClose)()
      }}
      onPressSave={onPressSave}
      onPressShare={onPressShare}
    />
  )
}

function withClampedSpring(value: any) {
  'worklet'
  return withSpring(value, {overshootClamping: true, stiffness: 120})
}

export default ImageViewingRoot
