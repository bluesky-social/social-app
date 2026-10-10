/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing
import {useCallback, useEffect, useMemo, useState} from 'react'
import {PixelRatio, StyleSheet, useWindowDimensions, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import {usePanGesture} from 'react-native-gesture-handler'
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view'
import Animated, {
  type AnimatableValue,
  type AnimatedRef,
  interpolate,
  measure,
  type MeasuredDimensions,
  ReduceMotion,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated'
import {scheduleOnRN, scheduleOnUI} from 'react-native-worklets'
import {Image} from 'expo-image'
import * as ScreenOrientation from 'expo-screen-orientation'
import {PlatformInfo} from '@bsky.app/expo-bluesky-swiss-army'

import {type Dimensions} from '#/lib/media/types'
import {useTheme} from '#/alf'
import {setSystemUITheme} from '#/alf/util/systemUI'
import {type Lightbox} from '#/components/Lightbox/state'
import {useAnalytics} from '#/analytics'
import {IS_IOS} from '#/env'
import {Footer} from '../chrome/Footer'
import {Header} from '../chrome/Header'
import {
  type ImageSource,
  type LightboxTransforms,
  type Transform,
} from '../types'
import ImageItem from './ImageItem/ImageItem'

type Rect = {x: number; y: number; width: number; height: number}
/**
 * Where the image sits while open, relative to its resting position. The
 * border radius is in screen points, regardless of scale.
 */
type ImagePlacement = {
  translateX: number
  translateY: number
  scale: number
  borderRadius: number
}

const PORTRAIT_UP = ScreenOrientation.OrientationLock.PORTRAIT_UP
const PIXEL_RATIO = PixelRatio.get()
const AT_REST: ImagePlacement = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  borderRadius: 0,
}

const SLOW_SPRING: WithSpringConfig = {
  mass: IS_IOS ? 1.25 : 0.75,
  damping: 300,
  stiffness: 800,
}
const FAST_SPRING: WithSpringConfig = {
  mass: IS_IOS ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
}

/**
 * How far (in finger travel) a slow dismiss swipe has to go before letting go
 * closes the lightbox rather than putting the image back.
 */
const DISMISS_DISTANCE = 100
/**
 * Releases faster than this (px/s) are decided by direction instead of
 * distance, so a flick closes and a flick back towards the middle cancels.
 */
const DISMISS_VELOCITY = 200
/**
 * How small the image gets while dragging, reached half a screen away.
 */
const DISMISS_MIN_SCALE = 0.75
/**
 * How closely the image follows the finger at the start of a dismiss swipe,
 * as a fraction of finger travel. It then tapers off with distance.
 */
const DISMISS_FOLLOW_X = 0.8
const DISMISS_FOLLOW_Y = 0.8
const DISMISS_CANCEL_SPRING: WithSpringConfig = {
  stiffness: 700,
  damping: 50,
  mass: 1,
  reduceMotion: ReduceMotion.Never,
}

function canAnimate(lightbox: Lightbox): boolean {
  if (PlatformInfo.getIsReducedMotionEnabled()) {
    return false
  }
  const img = lightbox.images[lightbox.index]
  return !!img.thumbRect && !!(img.dimensions || img.thumbDimensions)
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
  // Lives here rather than in ImageView so it survives the remount
  // when the orientation-based key below changes on rotation.
  const [imageIndex, setImageIndex] = useState(nextLightbox?.index ?? 0)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait',
  )
  const openProgress = useSharedValue(0)
  const thumbRects = useSharedValue<Record<number, MeasuredDimensions | null>>(
    {},
  )

  if (!activeLightbox && nextLightbox) {
    setActiveLightbox(nextLightbox)
    setImageIndex(nextLightbox.index)
  }

  useEffect(() => {
    if (!nextLightbox) {
      return
    }

    const initial: Record<number, MeasuredDimensions | null> = {}
    nextLightbox.images.forEach((img, i) => {
      initial[i] = img.thumbRect ?? null
    })
    thumbRects.set(initial)

    const isAnimated = canAnimate(nextLightbox)

    // https://github.com/software-mansion/react-native-reanimated/issues/6677
    rAF_FIXED(() => {
      openProgress.set(isAnimated ? withClampedSpring(1, SLOW_SPRING) : 1)
    })
    return () => {
      // https://github.com/software-mansion/react-native-reanimated/issues/6677
      rAF_FIXED(() => {
        openProgress.set(isAnimated ? withClampedSpring(0, SLOW_SPRING) : 0)
      })
    }
  }, [nextLightbox, openProgress, thumbRects])

  const onFullyClosed = useCallback(() => {
    setActiveLightbox(null)
    scheduleOnUI(() => {
      'worklet'
      thumbRects.set({})
    })
    requestIdleCallback(() => {
      void Image.clearMemoryCache()
    })
  }, [thumbRects])

  useAnimatedReaction(
    () => openProgress.get() === 0,
    (isGone, wasGone) => {
      if (isGone && !wasGone) {
        scheduleOnRN(onFullyClosed)
      }
    },
  )

  // Delay the unlock until after we've finished the scale up animation.
  // It's complicated to do the same for locking it back so we don't attempt that.
  useAnimatedReaction(
    () => openProgress.get() === 1,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen) {
        scheduleOnRN(ScreenOrientation.unlockAsync)
      } else if (!isOpen && wasOpen) {
        // default is PORTRAIT_UP - set via config plugin in app.config.js -sfn
        scheduleOnRN(ScreenOrientation.lockAsync, PORTRAIT_UP)
      }
    },
  )

  return (
    // Keep it always mounted to avoid flicker on the first frame.
    <View
      style={[styles.screen, !activeLightbox && styles.screenHidden]}
      aria-modal
      accessibilityViewIsModal
      aria-hidden={!activeLightbox}>
      <Animated.View
        ref={ref}
        style={{flex: 1}}
        collapsable={false}
        onLayout={e => {
          const layout = e.nativeEvent.layout
          setOrientation(
            layout.height > layout.width ? 'portrait' : 'landscape',
          )
        }}>
        {activeLightbox && (
          <ImageView
            key={activeLightbox.id + '-' + orientation}
            lightbox={activeLightbox}
            imageIndex={imageIndex}
            setImageIndex={setImageIndex}
            orientation={orientation}
            onRequestClose={onRequestClose}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
            safeAreaRef={ref}
            openProgress={openProgress}
            thumbRects={thumbRects}
          />
        )}
      </Animated.View>
    </View>
  )
}

function ImageView({
  lightbox,
  imageIndex,
  setImageIndex,
  orientation,
  onRequestClose,
  onPressSave,
  onPressShare,
  safeAreaRef,
  openProgress,
  thumbRects,
}: {
  lightbox: Lightbox
  imageIndex: number
  setImageIndex: React.Dispatch<React.SetStateAction<number>>
  orientation: 'portrait' | 'landscape'
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
  safeAreaRef: AnimatedRef<View>
  openProgress: SharedValue<number>
  thumbRects: SharedValue<Record<number, MeasuredDimensions | null>>
}) {
  const {images, metricsContext, onIndexChange} = lightbox
  // Capture at mount: after a rotation remount this is the preserved
  // current index, so the pager re-opens on the same image.
  const [initialImageIndex] = useState(imageIndex)
  const ax = useAnalytics()
  const isAnimated = useMemo(() => canAnimate(lightbox), [lightbox])
  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isAltExpanded, setIsAltExpanded] = useState(false)
  const dismissSwipeTranslateX = useSharedValue(0)
  const dismissSwipeTranslateY = useSharedValue(0)
  const isDismissing = useSharedValue(false)

  const containerStyle = useAnimatedStyle(() => {
    if (openProgress.get() < 1) {
      return {
        pointerEvents: 'none',
        opacity: isAnimated ? 1 : 0,
      }
    }
    if (isDismissing.get()) {
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
    if (screenSize && orientation === 'portrait') {
      opacity -= getDismissSwipeProgress(
        dismissSwipeTranslateY.get(),
        screenSize.height,
      )
    }
    const openProgressValue = openProgress.get()
    if (openProgressValue < 1) {
      // Closing after a dismiss swipe fades out from wherever the swipe left it.
      opacity *= Math.sqrt(openProgressValue)
    }
    const factor = IS_IOS ? 100 : 50
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

  const activeThumbRef = images[imageIndex]?.thumbRef

  /**
   * Re-measures the active image's thumbnail so the close animation lands on
   * it, which may not be the one the lightbox was opened from.
   */
  const measureActiveThumb = useCallback(() => {
    'worklet'
    if (!activeThumbRef) {
      return
    }
    const rect = measure(activeThumbRef)
    thumbRects.modify(rects => {
      'worklet'
      rects[imageIndex] = rect
      return rects
    })
  }, [activeThumbRef, imageIndex, thumbRects])

  const handleRequestClose = useCallback(() => {
    if (isAnimated && activeThumbRef) {
      scheduleOnUI(() => {
        'worklet'
        measureActiveThumb()
        scheduleOnRN(onRequestClose)
      })
    } else {
      onRequestClose()
    }
  }, [isAnimated, activeThumbRef, measureActiveThumb, onRequestClose])

  const onDismissSwipe = useCallback(() => {
    'worklet'
    if (isAnimated) {
      measureActiveThumb()
      /*
       * Start closing right away on the UI thread so the image doesn't stall
       * where it was let go. The close effect in ImageViewRoot then sets the
       * same spring, which Reanimated continues rather than restarting.
       */
      openProgress.set(withClampedSpring(0, SLOW_SPRING))
    } else {
      openProgress.set(0)
    }
    scheduleOnRN(onRequestClose)
  }, [isAnimated, measureActiveThumb, openProgress, onRequestClose])

  const onTap = useCallback(() => {
    setShowControls(show => !show)
  }, [])

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled)
    if (nextIsScaled) {
      setShowControls(false)
    }
  }, [])

  // style system ui on android
  const t = useTheme()
  useEffect(() => {
    setSystemUITheme('lightbox', t)
    return () => {
      setSystemUITheme('theme', t)
    }
  }, [t])

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <SystemBars
        style={{statusBar: 'light', navigationBar: 'light'}}
        hidden={{
          statusBar: isScaled || !showControls,
          navigationBar: false,
        }}
      />
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        renderToHardwareTextureAndroid
      />
      <PagerView
        scrollEnabled={!isScaled}
        initialPage={initialImageIndex}
        onPageSelected={(e: PagerViewOnPageSelectedEvent) => {
          const next = e.nativeEvent.position
          if (next !== imageIndex) {
            onIndexChange?.(next)
          }
          setImageIndex(prev => {
            if (metricsContext && prev !== next) {
              ax.metric('post:photoEmbed:lightboxSwipe', {
                layout: metricsContext.layout,
                fromImage: prev + 1,
                toImage: next + 1,
                totalImages: images.length,
                postUri: metricsContext.postUri,
                postAuthorDid: metricsContext.postAuthorDid,
                feedDescriptor: metricsContext.feedDescriptor,
              })
            }
            return next
          })
          setIsScaled(false)
        }}
        onPageScrollStateChanged={(e: PageScrollStateChangedNativeEvent) => {
          setIsDragging(e.nativeEvent.pageScrollState !== 'idle')
        }}
        overdrag={true}
        style={styles.pager}>
        {images.map((imageSrc, i) => (
          <View key={`${i}-${imageSrc.uri}`}>
            <LightboxImage
              onTap={onTap}
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={handleRequestClose}
              isScrollViewBeingDragged={isDragging}
              showControls={showControls}
              safeAreaRef={safeAreaRef}
              isScaled={isScaled}
              isDismissing={isDismissing}
              isActive={i === imageIndex}
              dismissSwipeTranslateX={dismissSwipeTranslateX}
              dismissSwipeTranslateY={dismissSwipeTranslateY}
              onDismissSwipe={onDismissSwipe}
              openProgress={openProgress}
              thumbRects={thumbRects}
              imageIndex={i}
            />
          </View>
        ))}
      </PagerView>
      <View style={styles.controls} pointerEvents="box-none">
        <Animated.View
          style={animatedHeaderStyle}
          pointerEvents="box-none"
          renderToHardwareTextureAndroid>
          <Header
            onRequestClose={handleRequestClose}
            onPressShare={() => onPressShare(images[imageIndex].uri)}
            onPressSave={() => onPressSave(images[imageIndex].uri)}
            imageCount={images.length}
            activeIndex={imageIndex}
          />
        </Animated.View>
        <Animated.View
          style={animatedFooterStyle}
          pointerEvents="box-none"
          renderToHardwareTextureAndroid={!isAltExpanded}>
          <Footer
            altText={images[imageIndex].alt}
            isAltExpanded={isAltExpanded}
            onToggleAltExpanded={() => setIsAltExpanded(e => !e)}
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
  isDismissing,
  isActive,
  showControls,
  safeAreaRef,
  openProgress,
  dismissSwipeTranslateX,
  dismissSwipeTranslateY,
  onDismissSwipe,
  thumbRects,
  imageIndex,
}: {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  isScaled: boolean
  isActive: boolean
  isDismissing: SharedValue<boolean>
  showControls: boolean
  safeAreaRef: AnimatedRef<View>
  openProgress: SharedValue<number>
  dismissSwipeTranslateX: SharedValue<number>
  dismissSwipeTranslateY: SharedValue<number>
  /**
   * Worklet, called on the UI thread when a dismiss swipe is let go far or
   * fast enough to close.
   */
  onDismissSwipe: () => void
  thumbRects: SharedValue<Record<number, MeasuredDimensions | null>>
  imageIndex: number
}) {
  const [fetchedDims, setFetchedDims] = useState<Dimensions | null>(null)
  const dims = fetchedDims ?? imageSrc.dimensions ?? imageSrc.thumbDimensions
  let imageAspect: number | undefined
  if (dims) {
    imageAspect = dims.width / dims.height
    if (Number.isNaN(imageAspect)) {
      imageAspect = undefined
    }
  }

  const {
    width: widthDelayedForJSThreadOnly,
    height: heightDelayedForJSThreadOnly,
  } = useWindowDimensions()
  const measureSafeArea = useCallback(() => {
    'worklet'
    let safeArea: Rect | null = measure(safeAreaRef)
    if (!safeArea) {
      if (_WORKLET) {
        console.error('Expected to always be able to measure safe area.')
      }
      safeArea = {
        x: 0,
        y: 0,
        width: widthDelayedForJSThreadOnly,
        height: heightDelayedForJSThreadOnly,
      }
    }
    return safeArea
  }, [safeAreaRef, heightDelayedForJSThreadOnly, widthDelayedForJSThreadOnly])

  const {thumbRect: thumbRectJS, thumbBorderRadius} = imageSrc
  const transforms = useDerivedValue<LightboxTransforms>(() => {
    'worklet'
    const safeArea = measureSafeArea()
    const openProgressValue = openProgress.get()

    if (openProgressValue === 0) {
      return {
        isHidden: true,
        isResting: false,
        borderRadius: 0,
        scaleAndMoveTransform: [],
        cropFrameTransform: [],
        cropContentTransform: [],
      }
    }

    /*
     * The active image follows the dismiss swipe. When the swipe closes the
     * lightbox the translation is left as-is, so the close animation starts
     * from wherever the image was let go.
     */
    const dismissTransform = isActive
      ? getDismissSwipeTransform(
          dismissSwipeTranslateX.get(),
          dismissSwipeTranslateY.get(),
          safeArea,
          thumbBorderRadius,
        )
      : AT_REST

    if (isActive && imageAspect && openProgressValue < 1) {
      let thumbRect
      if (_WORKLET) {
        thumbRect = thumbRects.get()[imageIndex]
      } else {
        thumbRect = thumbRectJS
      }
      if (thumbRect) {
        return interpolateTransform(
          openProgressValue,
          thumbRect,
          safeArea,
          imageAspect,
          dismissTransform,
          thumbBorderRadius,
        )
      }
    }
    return {
      isHidden: false,
      isResting:
        dismissTransform.translateX === 0 && dismissTransform.translateY === 0,
      borderRadius: dismissTransform.borderRadius / dismissTransform.scale,
      scaleAndMoveTransform: [
        {translateX: dismissTransform.translateX},
        {translateY: dismissTransform.translateY},
        {scale: dismissTransform.scale},
      ],
      cropFrameTransform: [],
      cropContentTransform: [],
    }
  })

  const dismissSwipePan = usePanGesture({
    enabled: isActive && !isScaled && !isScrollViewBeingDragged,
    activeOffsetY: [-10, 10],
    failOffsetX: [-10, 10],
    maxPointers: 1,
    onUpdate: e => {
      'worklet'
      if (openProgress.get() !== 1 || isDismissing.get()) {
        return
      }
      dismissSwipeTranslateX.set(e.translationX)
      dismissSwipeTranslateY.set(e.translationY)
    },
    onDeactivate: e => {
      'worklet'
      if (openProgress.get() !== 1 || isDismissing.get()) {
        return
      }
      const shouldDismiss =
        Math.abs(e.velocityY) > DISMISS_VELOCITY
          ? e.velocityY * e.translationY >= 0
          : Math.abs(e.translationY) > DISMISS_DISTANCE
      if (shouldDismiss) {
        isDismissing.set(true)
        onDismissSwipe()
      } else {
        dismissSwipeTranslateX.set(withSpring(0, DISMISS_CANCEL_SPRING))
        dismissSwipeTranslateY.set(withSpring(0, DISMISS_CANCEL_SPRING))
      }
    },
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
  /**
   * Where the image sits at progress=1. Usually at rest, but when closing
   * from a dismiss swipe it's wherever the swipe left it.
   */
  openTransform: ImagePlacement,
  thumbBorderRadius?: number,
): {
  scaleAndMoveTransform: Transform
  cropFrameTransform: Transform
  cropContentTransform: Transform
  borderRadius: number
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
  const scale = interpolate(
    progress,
    [0, 1],
    [initialScale, openTransform.scale],
  )
  const translateX = interpolatePx(
    progress,
    [0, 1],
    [initialTranslateX, openTransform.translateX],
  )
  const translateY = interpolatePx(
    progress,
    [0, 1],
    [initialTranslateY, openTransform.translateY],
  )
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
  /*
   * Interpolate the radius as it appears on screen, then undo the overall and
   * crop frame scales so it visually matches the thumbnail at progress=0.
   */
  const visualBorderRadius = interpolate(
    progress,
    [0, 1],
    [thumbBorderRadius ?? 0, openTransform.borderRadius],
  )
  const borderRadius = visualBorderRadius / (scale * cropScaleX)

  return {
    isHidden: false,
    isResting: progress === 1,
    scaleAndMoveTransform: [{translateX}, {translateY}, {scale}],
    cropFrameTransform: [{scaleX: cropScaleX}, {scaleY: cropScaleY}],
    cropContentTransform: [{scaleX: 1 / cropScaleX}, {scaleY: 1 / cropScaleY}],
    borderRadius,
  }
}

/**
 * How far through a dismiss swipe the finger is, from 0 at rest to 1 at half
 * a screen away. Drives the backdrop fade and how much the image shrinks.
 */
function getDismissSwipeProgress(translateY: number, screenHeight: number) {
  'worklet'
  return Math.min(Math.abs(translateY) / (screenHeight / 2), 1)
}

/**
 * Where the image sits for a given dismiss swipe finger translation. Like the
 * iOS Photos app, it shrinks a little and follows the finger with some
 * resistance - more so horizontally. Its corners round off to match the
 * thumbnail by the time letting go would close it, so the return animation
 * only has to move it.
 */
function getDismissSwipeTransform(
  translateX: number,
  translateY: number,
  screenSize: {width: number; height: number},
  thumbBorderRadius = 0,
): ImagePlacement {
  'worklet'
  const progress = getDismissSwipeProgress(translateY, screenSize.height)
  const roundingProgress = Math.min(Math.abs(translateY) / DISMISS_DISTANCE, 1)
  return {
    translateX: rubberBand(translateX, screenSize.width / 2, DISMISS_FOLLOW_X),
    translateY: rubberBand(translateY, screenSize.height, DISMISS_FOLLOW_Y),
    scale: 1 - (1 - DISMISS_MIN_SCALE) * progress,
    borderRadius: thumbBorderRadius * roundingProgress,
  }
}

/**
 * Damps a drag distance so it starts out moving at `coefficient` times the
 * finger and tapers off, never quite reaching `limit`. Same curve as
 * UIScrollView's overscroll.
 */
function rubberBand(distance: number, limit: number, coefficient: number) {
  'worklet'
  const magnitude = Math.abs(distance)
  const damped = (1 - 1 / ((magnitude * coefficient) / limit + 1)) * limit
  return Math.sign(distance) * damped
}

function withClampedSpring<T extends AnimatableValue>(
  value: T,
  config: WithSpringConfig,
): T {
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
