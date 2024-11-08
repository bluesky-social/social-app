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
import {LayoutAnimation, Platform, StyleSheet, View} from 'react-native'
import {Gesture} from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'
import Animated, {
  AnimatedRef,
  cancelAnimation,
  measure,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {Edge, SafeAreaView} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'

import {useImageDimensions} from '#/lib/media/image-sizes'
import {colors, s} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {Lightbox} from '#/state/lightbox'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {ImageSource} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'

const EDGES =
  Platform.OS === 'android'
    ? (['top', 'bottom', 'left', 'right'] satisfies Edge[])
    : (['left', 'right'] satisfies Edge[]) // iOS, so no top/bottom safe area

export default function ImageViewRoot({
  lightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox | null
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}) {
  const ref = useAnimatedRef<View>()
  return (
    // Keep it always mounted to avoid flicker on the first frame.
    <SafeAreaView
      style={[styles.screen, !lightbox && styles.screenHidden]}
      edges={EDGES}
      aria-modal
      accessibilityViewIsModal
      aria-hidden={!lightbox}>
      <Animated.View ref={ref} style={{flex: 1}} collapsable={false}>
        {lightbox && (
          <ImageView
            key={lightbox.id}
            lightbox={lightbox}
            onRequestClose={onRequestClose}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
            safeAreaRef={ref}
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
  safeAreaRef,
}: {
  lightbox: Lightbox
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
  safeAreaRef: AnimatedRef<View>
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
    if (isFlyingAway.value) {
      return {pointerEvents: 'none'}
    }
    return {pointerEvents: 'auto'}
  })
  const backdropStyle = useAnimatedStyle(() => {
    const screenSize = measure(safeAreaRef)
    let opacity = 1
    if (screenSize) {
      const dragProgress = Math.min(
        Math.abs(dismissSwipeTranslateY.value) / (screenSize.height / 2),
        1,
      )
      opacity -= dragProgress
    }
    return {
      opacity,
    }
  })
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(show ? 1 : 0),
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
      flexGrow: 1,
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(show ? 1 : 0),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : 30),
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

  return (
    <Animated.View style={[styles.container, containerStyle]}>
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
  dismissSwipeTranslateY: SharedValue<number>
}) {
  const [imageAspect, imageDimensions] = useImageDimensions({
    src: imageSrc.uri,
    knownDimensions: imageSrc.dimensions,
  })

  const dismissSwipePan = Gesture.Pan()
    .enabled(isActive && !isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate(e => {
      'worklet'
      if (isFlyingAway.value) {
        return
      }
      dismissSwipeTranslateY.value = e.translationY
    })
    .onEnd(e => {
      'worklet'
      if (isFlyingAway.value) {
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
        runOnJS(onRequestClose)()
      }
    },
  )

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: dismissSwipeTranslateY.value}],
    }
  })
  return (
    <ImageItem
      imageSrc={imageSrc}
      onTap={onTap}
      onZoom={onZoom}
      onRequestClose={onRequestClose}
      isScrollViewBeingDragged={isScrollViewBeingDragged}
      showControls={showControls}
      safeAreaRef={safeAreaRef}
      imageAspect={imageAspect}
      imageDimensions={imageDimensions}
      imageStyle={imageStyle}
      dismissSwipePan={dismissSwipePan}
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

function withClampedSpring(value: any) {
  'worklet'
  return withSpring(value, {overshootClamping: true, stiffness: 300})
}
