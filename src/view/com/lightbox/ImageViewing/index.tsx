/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {useEffect, useMemo, useState} from 'react'
import {LayoutAnimation, StyleSheet, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import Animated, {
  type AnimatedRef,
  cancelAnimation,
  measure,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as ScreenOrientation from 'expo-screen-orientation'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'

import {colors, s} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {type Lightbox} from '#/state/lightbox'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {useTheme} from '#/alf'
import {setSystemUITheme} from '#/alf/util/systemUI'
import {PlatformInfo} from '../../../../../modules/expo-bluesky-swiss-army'
import {type ImageSource} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'

const PORTRAIT_UP = ScreenOrientation.OrientationLock.PORTRAIT_UP

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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait',
  )
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

  // Delay the unlock until after we've finished the scale up animation.
  // It's complicated to do the same for locking it back so we don't attempt that.
  useAnimatedReaction(
    () => openProgress.get() === 1,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen) {
        runOnJS(ScreenOrientation.unlockAsync)()
      } else if (!isOpen && wasOpen) {
        // default is PORTRAIT_UP - set via config plugin in app.config.js -sfn
        runOnJS(ScreenOrientation.lockAsync)(PORTRAIT_UP)
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
            orientation={orientation}
            onRequestClose={onRequestClose}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
            onFlyAway={onFlyAway}
            safeAreaRef={ref}
            openProgress={openProgress}
          />
        )}
      </Animated.View>
    </View>
  )
}

function ImageView({
  lightbox,
  orientation,
  onRequestClose,
  onPressSave,
  onPressShare,
  onFlyAway,
  safeAreaRef,
  openProgress,
}: {
  lightbox: Lightbox
  orientation: 'portrait' | 'landscape'
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
  onFlyAway: () => void
  safeAreaRef: AnimatedRef<View>
  openProgress: SharedValue<number>
}) {
  const {images, index: initialImageIndex} = lightbox
  const isAnimated = useMemo(() => canAnimate(lightbox), [lightbox])
  const [isScaled] = useState(false)
  const [imageIndex] = useState(initialImageIndex)
  const [showControls] = useState(true)
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
    } else if (screenSize && orientation === 'portrait') {
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
