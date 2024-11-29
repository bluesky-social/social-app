/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  LayoutAnimation,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
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
  WithSpringConfig,
} from 'react-native-reanimated'
import {
  Edge,
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {StatusBar} from 'expo-status-bar'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'

import {Dimensions} from '#/lib/media/types'
import {colors, s} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {Lightbox} from '#/state/lightbox'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {ios, useTheme} from '#/alf'
import {setNavigationBar} from '#/alf/util/navigationBar'
import {PlatformInfo} from '../../../../../modules/expo-bluesky-swiss-army'
import {ImageSource, Transform} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'

type Rect = {x: number; y: number; width: number; height: number}

const PIXEL_RATIO = PixelRatio.get()
const EDGES =
  Platform.OS === 'android'
    ? (['top', 'bottom', 'left', 'right'] satisfies Edge[])
    : (['left', 'right'] satisfies Edge[]) // iOS, so no top/bottom safe area

const SLOW_SPRING: WithSpringConfig = {
  mass: isIOS ? 1.25 : 0.75,
  damping: 300,
  stiffness: 800,
  restDisplacementThreshold: 0.01,
}
const FAST_SPRING: WithSpringConfig = {
  mass: isIOS ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
}

function canAnimate(lightbox: Lightbox): boolean {
  return (
    !PlatformInfo.getIsReducedMotionEnabled() &&
    lightbox.images.every(
      img => img.thumbRect && (img.dimensions || img.thumbDimensions),
    )
  )
}

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

    const isAnimated = canAnimate(nextLightbox)

    // https://github.com/software-mansion/react-native-reanimated/issues/6677
    rAF_FIXED(() => {
      openProgress.set(() =>
        isAnimated ? withClampedSpring(1, SLOW_SPRING) : 1,
      )
    })
    return () => {
      // https://github.com/software-mansion/react-native-reanimated/issues/6677
      rAF_FIXED(() => {
        openProgress.set(() =>
          isAnimated ? withClampedSpring(0, SLOW_SPRING) : 0,
        )
      })
    }
  }, [nextLightbox, openProgress])

  useAnimatedReaction(
    () => openProgress.get() === 0,
    (isGone, wasGone) => {
      if (isGone && !wasGone) {
        runOnJS(setActiveLightbox)(null)
      }
    },
  )

  const onFlyAway = React.useCallback(() => {
    'worklet'
    openProgress.set(0)
    runOnJS(onRequestClose)()
  }, [onRequestClose, openProgress])

  return (
    // Keep it always mounted to avoid flicker on the first frame.
    <SafeAreaView
      style={[styles.screen, !activeLightbox && styles.screenHidden]}
      edges={EDGES}
      aria-modal
      accessibilityViewIsModal
      aria-hidden={!activeLightbox}>
      <Animated.View ref={ref} style={{flex: 1}} collapsable={false}>
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
  const isAnimated = useMemo(() => canAnimate(lightbox), [lightbox])
  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const [showControls, setShowControls] = useState(true)
  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const dismissSwipeTranslateY = useSharedValue(0)
  const isFlyingAway = useSharedValue(false)

  const containerStyle = useAnimatedStyle(() => {
    if (openProgress.get() < 1) {
      return {
        pointerEvents: 'none',
        opacity: isAnimated ? 1 : 0,
      }
    }
    if (isFlyingAway.get()) {
      return {
        pointerEvents: 'none',
        opacity: 1,
      }
    }
    return {pointerEvents: 'auto', opacity: 1}
  })

  const backdropStyle = useAnimatedStyle(() => {
    const screenSize = measure(safeAreaRef)
    let opacity = 1
    const openProgressValue = openProgress.get()
    if (openProgressValue < 1) {
      opacity = Math.sqrt(openProgressValue)
    } else if (screenSize) {
      const dragProgress = Math.min(
        Math.abs(dismissSwipeTranslateY.get()) / (screenSize.height / 2),
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
    const show = showControls && dismissSwipeTranslateY.get() === 0
    return {
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.get() === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : -30, FAST_SPRING),
        },
      ],
    }
  })
  const animatedFooterStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.get() === 0
    return {
      flexGrow: 1,
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.get() === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : 30, FAST_SPRING),
        },
      ],
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
        Math.abs(dismissSwipeTranslateY.get()) > screenSize.height
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

  // style nav bar on android
  const t = useTheme()
  useEffect(() => {
    setNavigationBar('lightbox', t)
    return () => {
      setNavigationBar('theme', t)
    }
  }, [t])

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar
        animated
        style="light"
        hideTransitionAnimation="slide"
        backgroundColor="black"
        // hiding causes layout shifts on android,
        // so avoid until we add edge-to-edge mode
        hidden={ios(isScaled || !showControls)}
      />
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
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
        style={styles.pager}>
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
      <View style={styles.controls}>
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
    const openProgressValue = openProgress.get()
    const dismissTranslateY =
      isActive && openProgressValue === 1 ? dismissSwipeTranslateY.get() : 0

    if (openProgressValue === 0 && isFlyingAway.get()) {
      return {
        isHidden: true,
        isResting: false,
        scaleAndMoveTransform: [],
        cropFrameTransform: [],
        cropContentTransform: [],
      }
    }

    if (isActive && thumbRect && imageAspect && openProgressValue < 1) {
      return interpolateTransform(
        openProgressValue,
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
      if (openProgress.get() !== 1 || isFlyingAway.get()) {
        return
      }
      dismissSwipeTranslateY.set(e.translationY)
    })
    .onEnd(e => {
      'worklet'
      if (openProgress.get() !== 1 || isFlyingAway.get()) {
        return
      }
      if (Math.abs(e.velocityY) > 200) {
        isFlyingAway.set(true)
        if (dismissSwipeTranslateY.get() === 0) {
          // HACK: If the initial value is 0, withDecay() animation doesn't start.
          // This is a bug in Reanimated, but for now we'll work around it like this.
          dismissSwipeTranslateY.set(1)
        }
        dismissSwipeTranslateY.set(() =>
          withDecay({
            velocity: e.velocityY,
            velocityFactor: Math.max(3500 / Math.abs(e.velocityY), 1), // Speed up if it's too slow.
            deceleration: 1, // Danger! This relies on the reaction below stopping it.
          }),
        )
      } else {
        dismissSwipeTranslateY.set(() =>
          withSpring(0, {
            stiffness: 700,
            damping: 50,
          }),
        )
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
  const {alt: altText, uri} = images[index]
  const isMomentumScrolling = React.useRef(false)
  return (
    <ScrollView
      style={styles.footerScrollView}
      scrollEnabled={isAltExpanded}
      onMomentumScrollBegin={() => {
        isMomentumScrolling.current = true
      }}
      onMomentumScrollEnd={() => {
        isMomentumScrolling.current = false
      }}
      contentContainerStyle={{
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}>
      <SafeAreaView edges={['bottom']}>
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
                toggleAltExpanded()
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
      </SafeAreaView>
    </ScrollView>
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
  screenHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  container: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    gap: 20,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  pager: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    width: '100%',
    top: 0,
    pointerEvents: 'box-none',
  },
  footer: {
    position: 'absolute',
    width: '100%',
    maxHeight: '100%',
    bottom: 0,
  },
  footerScrollView: {
    backgroundColor: '#000d',
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '100%',
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

function withClampedSpring(value: any, config: WithSpringConfig) {
  'worklet'
  return withSpring(value, {...config, overshootClamping: true})
}

// We have to do this because we can't trust RN's rAF to fire in order.
// https://github.com/facebook/react-native/issues/48005
let isFrameScheduled = false
let pendingFrameCallbacks: Array<() => void> = []
function rAF_FIXED(callback: () => void) {
  pendingFrameCallbacks.push(callback)
  if (!isFrameScheduled) {
    isFrameScheduled = true
    requestAnimationFrame(() => {
      const callbacks = pendingFrameCallbacks.slice()
      isFrameScheduled = false
      pendingFrameCallbacks = []
      let hasError = false
      let error
      for (let i = 0; i < callbacks.length; i++) {
        try {
          callbacks[i]()
        } catch (e) {
          hasError = true
          error = e
        }
      }
      if (hasError) {
        throw error
      }
    })
  }
}
