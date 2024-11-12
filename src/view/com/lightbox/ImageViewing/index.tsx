/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {useCallback, useState} from 'react'
import {LayoutAnimation, PixelRatio, Platform, View} from 'react-native'
import {Gesture} from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'
import Animated, {
  AnimatedRef,
  cancelAnimation,
  interpolate,
  measure,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {
  Edge,
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Dimensions} from '#/lib/media/types'
import {isIOS} from '#/platform/detection'
import {Lightbox} from '#/state/lightbox'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon} from '#/components/icons/FloppyDisk'
import {Text} from '#/components/Typography'
import {PlatformInfo} from '../../../../../modules/expo-bluesky-swiss-army'
import {ImageSource, Transform} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'
import {PlatformBackground} from './components/PlatformBackground'

type Rect = {x: number; y: number; width: number; height: number}

const PIXEL_RATIO = PixelRatio.get()
const EDGES =
  Platform.OS === 'android'
    ? (['top', 'bottom', 'left', 'right'] satisfies Edge[])
    : (['left', 'right'] satisfies Edge[]) // iOS, so no top/bottom safe area

const SLOW_SPRING = {stiffness: 120}
const FAST_SPRING = {stiffness: 700}

export default function ImageViewRoot({
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
  'use no memo'
  const ref = useAnimatedRef<View>()
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
      nextLightbox.images.every(
        img => img.thumbRect && (img.dimensions || img.thumbDimensions),
      )

    // https://github.com/software-mansion/react-native-reanimated/issues/6677
    requestAnimationFrame(() => {
      openProgress.value = canAnimate ? withClampedSpring(1, SLOW_SPRING) : 1
    })
    return () => {
      // https://github.com/software-mansion/react-native-reanimated/issues/6677
      requestAnimationFrame(() => {
        openProgress.value = canAnimate ? withClampedSpring(0, SLOW_SPRING) : 0
      })
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

  const onFlyAway = React.useCallback(() => {
    'worklet'
    openProgress.value = 0
    runOnJS(onRequestClose)()
  }, [onRequestClose, openProgress])

  return (
    <ThemeProvider theme="dark">
      {/* Keep it always mounted to avoid flicker on the first frame. */}
      <SafeAreaView
        style={[
          a.absolute,
          a.inset_0,
          !activeLightbox && [a.opacity_0, a.pointer_events_none],
        ]}
        edges={EDGES}
        aria-modal
        accessibilityViewIsModal
        aria-hidden={!activeLightbox}>
        <Animated.View ref={ref} style={[a.flex_1]} collapsable={false}>
          {activeLightbox && (
            <ImageView
              key={activeLightbox.id}
              lightbox={activeLightbox}
              onRequestClose={onRequestClose}
              onPressSave={onPressSave}
              onPressShare={onPressShare}
              onFlyAway={onFlyAway}
              safeAreaRef={ref}
              openProgress={openProgress}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </ThemeProvider>
  )
}

function ImageView({
  lightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
  onFlyAway,
  safeAreaRef,
  openProgress,
}: {
  lightbox: Lightbox
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
  onFlyAway: () => void
  safeAreaRef: AnimatedRef<View>
  openProgress: SharedValue<number>
}) {
  const {images, index: initialImageIndex} = lightbox
  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const [showControls, setShowControls] = useState(true)
  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const dismissSwipeTranslateY = useSharedValue(0)
  const isFlyingAway = useSharedValue(false)

  const containerStyle = useAnimatedStyle(() => {
    if (openProgress.value < 1 || isFlyingAway.value) {
      return {pointerEvents: 'none'}
    }
    return {pointerEvents: 'auto'}
  })

  const backdropStyle = useAnimatedStyle(() => {
    const screenSize = measure(safeAreaRef)
    let opacity = 1
    if (openProgress.value < 1) {
      opacity = Math.sqrt(openProgress.value)
    } else if (screenSize) {
      const dragProgress = Math.min(
        Math.abs(dismissSwipeTranslateY.value) / (screenSize.height / 2),
        1,
      )
      opacity -= dragProgress
    }
    const factor = isIOS ? 100 : 50
    return {
      opacity: Math.round(opacity * factor) / factor,
    }
  })

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.value === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [{translateY: withClampedSpring(show ? 0 : -30, FAST_SPRING)}],
    }
  })
  const animatedFooterStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      flexGrow: 1,
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.value === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [{translateY: withClampedSpring(show ? 0 : 30, FAST_SPRING)}],
    }
  })

  const onTap = useCallback(() => {
    setShowControls(show => !show)
  }, [])

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled)
    if (nextIsScaled) {
      setShowControls(false)
    }
  }, [])

  useAnimatedReaction(
    () => {
      const screenSize = measure(safeAreaRef)
      return (
        !screenSize ||
        Math.abs(dismissSwipeTranslateY.value) > screenSize.height
      )
    },
    (isOut, wasOut) => {
      if (isOut && !wasOut) {
        // Stop the animation from blocking the screen forever.
        cancelAnimation(dismissSwipeTranslateY)
        onFlyAway()
      }
    },
  )

  return (
    <Animated.View style={[a.flex_1, containerStyle]}>
      <Animated.View
        style={[
          a.absolute,
          a.inset_0,
          {backgroundColor: '#000'},
          backdropStyle,
        ]}
        renderToHardwareTextureAndroid
      />
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
        style={[a.flex_1]}>
        {images.map((imageSrc, i) => (
          <View key={imageSrc.uri}>
            <LightboxImage
              onTap={onTap}
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestClose}
              isScrollViewBeingDragged={isDragging}
              showControls={showControls}
              safeAreaRef={safeAreaRef}
              isScaled={isScaled}
              isFlyingAway={isFlyingAway}
              isActive={i === imageIndex}
              dismissSwipeTranslateY={dismissSwipeTranslateY}
              openProgress={openProgress}
            />
          </View>
        ))}
      </PagerView>
      <View
        style={[
          a.absolute,
          a.inset_0,
          a.gap_xl,
          a.z_10,
          a.pointer_events_box_none,
        ]}>
        <Animated.View
          style={animatedHeaderStyle}
          renderToHardwareTextureAndroid>
          <ImageDefaultHeader onRequestClose={onRequestClose} />
        </Animated.View>
        <Animated.View
          style={animatedFooterStyle}
          renderToHardwareTextureAndroid={!isAltExpanded}>
          <LightboxFooter
            images={images}
            index={imageIndex}
            isAltExpanded={isAltExpanded}
            toggleAltExpanded={() => setAltExpanded(e => !e)}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
          />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

function LightboxImage({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  isScrollViewBeingDragged,
  isScaled,
  isFlyingAway,
  isActive,
  showControls,
  safeAreaRef,
  openProgress,
  dismissSwipeTranslateY,
}: {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  isScaled: boolean
  isActive: boolean
  isFlyingAway: SharedValue<boolean>
  showControls: boolean
  safeAreaRef: AnimatedRef<View>
  openProgress: SharedValue<number>
  dismissSwipeTranslateY: SharedValue<number>
}) {
  const [fetchedDims, setFetchedDims] = React.useState<Dimensions | null>(null)
  const dims = fetchedDims ?? imageSrc.dimensions ?? imageSrc.thumbDimensions
  let imageAspect: number | undefined
  if (dims) {
    imageAspect = dims.width / dims.height
    if (Number.isNaN(imageAspect)) {
      imageAspect = undefined
    }
  }

  const safeFrameDelayedForJSThreadOnly = useSafeAreaFrame()
  const safeInsetsDelayedForJSThreadOnly = useSafeAreaInsets()
  const measureSafeArea = React.useCallback(() => {
    'worklet'
    let safeArea: Rect | null = measure(safeAreaRef)
    if (!safeArea) {
      if (_WORKLET) {
        console.error('Expected to always be able to measure safe area.')
      }
      const frame = safeFrameDelayedForJSThreadOnly
      const insets = safeInsetsDelayedForJSThreadOnly
      safeArea = {
        x: frame.x + insets.left,
        y: frame.y + insets.top,
        width: frame.width - insets.left - insets.right,
        height: frame.height - insets.top - insets.bottom,
      }
    }
    return safeArea
  }, [
    safeFrameDelayedForJSThreadOnly,
    safeInsetsDelayedForJSThreadOnly,
    safeAreaRef,
  ])

  const {thumbRect} = imageSrc
  const transforms = useDerivedValue(() => {
    'worklet'
    const safeArea = measureSafeArea()
    const dismissTranslateY =
      isActive && openProgress.value === 1 ? dismissSwipeTranslateY.value : 0

    if (openProgress.value === 0 && isFlyingAway.value) {
      return {
        isHidden: true,
        isResting: false,
        scaleAndMoveTransform: [],
        cropFrameTransform: [],
        cropContentTransform: [],
      }
    }

    if (isActive && thumbRect && imageAspect && openProgress.value < 1) {
      return interpolateTransform(
        openProgress.value,
        thumbRect,
        safeArea,
        imageAspect,
      )
    }
    return {
      isHidden: false,
      isResting: dismissTranslateY === 0,
      scaleAndMoveTransform: [{translateY: dismissTranslateY}],
      cropFrameTransform: [],
      cropContentTransform: [],
    }
  })

  const dismissSwipePan = Gesture.Pan()
    .enabled(isActive && !isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate(e => {
      'worklet'
      if (openProgress.value !== 1 || isFlyingAway.value) {
        return
      }
      dismissSwipeTranslateY.value = e.translationY
    })
    .onEnd(e => {
      'worklet'
      if (openProgress.value !== 1 || isFlyingAway.value) {
        return
      }
      if (Math.abs(e.velocityY) > 1000) {
        isFlyingAway.value = true
        if (dismissSwipeTranslateY.value === 0) {
          // HACK: If the initial value is 0, withDecay() animation doesn't start.
          // This is a bug in Reanimated, but for now we'll work around it like this.
          dismissSwipeTranslateY.value = 1
        }
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

  return (
    <ImageItem
      imageSrc={imageSrc}
      onTap={onTap}
      onZoom={onZoom}
      onRequestClose={onRequestClose}
      onLoad={setFetchedDims}
      isScrollViewBeingDragged={isScrollViewBeingDragged}
      showControls={showControls}
      measureSafeArea={measureSafeArea}
      imageAspect={imageAspect}
      imageDimensions={dims ?? undefined}
      dismissSwipePan={dismissSwipePan}
      transforms={transforms}
    />
  )
}

function LightboxFooter({
  images,
  index,
  isAltExpanded,
  toggleAltExpanded,
  onPressSave,
  onPressShare,
}: {
  images: ImageSource[]
  index: number
  isAltExpanded: boolean
  toggleAltExpanded: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {alt: altText, uri} = images[index]
  const isMomentumScrolling = React.useRef(false)
  return (
    <ScrollView
      style={[
        a.flex_1,
        a.max_h_full,
        a.w_full,
        a.absolute,
        a.bottom_0,
        a.overflow_hidden,
        {borderTopLeftRadius: 8, borderTopRightRadius: 8},
      ]}
      scrollEnabled={isAltExpanded}
      onMomentumScrollBegin={() => {
        isMomentumScrolling.current = true
      }}
      onMomentumScrollEnd={() => {
        isMomentumScrolling.current = false
      }}>
      <PlatformBackground style={[a.py_md, a.px_2xl]}>
        <SafeAreaView edges={['bottom']}>
          {altText ? (
            <View
              accessibilityRole="button"
              style={[isIOS ? a.pb_xl : a.pb_lg]}>
              <Text
                style={[t.atoms.text_contrast_high]}
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
                  toggleAltExpanded()
                }}
                onLongPress={() => {}}>
                {altText}
              </Text>
            </View>
          ) : null}
          <ThemeProvider theme="light">
            <View style={[a.w_full, a.flex_row, a.justify_center, a.gap_sm]}>
              <Button
                label={_(msg`Save`)}
                color="secondary_inverted"
                variant="solid"
                size="small"
                onPress={() => onPressSave(uri)}>
                <ButtonIcon icon={SaveIcon} />
                <ButtonText>
                  <Trans context="action">Save</Trans>
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Share`)}
                color="secondary_inverted"
                variant="solid"
                size="small"
                onPress={() => onPressShare(uri)}>
                <ButtonIcon icon={ShareIcon} />
                <ButtonText>
                  <Trans context="action">Share</Trans>
                </ButtonText>
              </Button>
            </View>
          </ThemeProvider>
        </SafeAreaView>
      </PlatformBackground>
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
  safeArea: {width: number; height: number; x: number; y: number},
  imageAspect: number,
): {
  scaleAndMoveTransform: Transform
  cropFrameTransform: Transform
  cropContentTransform: Transform
  isResting: boolean
  isHidden: boolean
} {
  'worklet'
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
  const safeAreaAspect = safeArea.width / safeArea.height
  let finalWidth
  let finalHeight
  if (safeAreaAspect > imageAspect) {
    finalWidth = safeArea.height * imageAspect
    finalHeight = safeArea.height
  } else {
    finalWidth = safeArea.width
    finalHeight = safeArea.width / imageAspect
  }
  const initialScale = Math.min(
    uncroppedInitialWidth / finalWidth,
    uncroppedInitialHeight / finalHeight,
  )
  const croppedFinalWidth = thumbnailDims.width / initialScale
  const croppedFinalHeight = thumbnailDims.height / initialScale
  const screenCenterX = safeArea.width / 2
  const screenCenterY = safeArea.height / 2
  const thumbnailSafeAreaX = thumbnailDims.pageX - safeArea.x
  const thumbnailSafeAreaY = thumbnailDims.pageY - safeArea.y
  const thumbnailCenterX = thumbnailSafeAreaX + thumbnailDims.width / 2
  const thumbnailCenterY = thumbnailSafeAreaY + thumbnailDims.height / 2
  const initialTranslateX = thumbnailCenterX - screenCenterX
  const initialTranslateY = thumbnailCenterY - screenCenterY
  const scale = interpolate(progress, [0, 1], [initialScale, 1])
  const translateX = interpolatePx(progress, [0, 1], [initialTranslateX, 0])
  const translateY = interpolatePx(progress, [0, 1], [initialTranslateY, 0])
  const cropScaleX = interpolate(
    progress,
    [0, 1],
    [croppedFinalWidth / finalWidth, 1],
  )
  const cropScaleY = interpolate(
    progress,
    [0, 1],
    [croppedFinalHeight / finalHeight, 1],
  )
  return {
    isHidden: false,
    isResting: progress === 1,
    scaleAndMoveTransform: [{translateX}, {translateY}, {scale}],
    cropFrameTransform: [{scaleX: cropScaleX}, {scaleY: cropScaleY}],
    cropContentTransform: [{scaleX: 1 / cropScaleX}, {scaleY: 1 / cropScaleY}],
  }
}

function withClampedSpring(value: any, {stiffness}: {stiffness: number}) {
  'worklet'
  return withSpring(value, {overshootClamping: true, stiffness})
}
