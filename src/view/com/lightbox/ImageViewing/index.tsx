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
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import {Gesture} from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'
import {interpolate, MeasuredDimensions} from 'react-native-reanimated'
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

import {colors, s} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {ImageSource} from './@types'
import ImageDefaultHeader from './components/ImageDefaultHeader'
import ImageItem from './components/ImageItem/ImageItem'

const SCREEN = Dimensions.get('screen')

type Props = {
  images: ImageSource[]
  thumbDims: MeasuredDimensions | null
  initialImageIndex: number
  visible: boolean
  onRequestClose: () => void
  backgroundColor?: string
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
}

const SCREEN_HEIGHT = Dimensions.get('window').height

function ImageViewing({
  images,
  thumbDims,
  initialImageIndex,
  visible,
  onRequestClose,
  onPressSave,
  onPressShare,
}: Props) {
  const openProgress = useSharedValue(0)
  React.useEffect(() => {
    openProgress.value = withClampedSpring(1)
  }, [openProgress])

  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const [showControls, setShowControls] = useState(true)
  const dismissSwipeTranslateY = useSharedValue(0)

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0
    return {
      pointerEvents: show ? 'auto' : 'none',
      opacity: withClampedSpring(show && openProgress.value > 0 ? 1 : 0),
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
      opacity: withClampedSpring(show && openProgress.value > 0 ? 1 : 0),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : 30),
        },
      ],
    }
  })

  const activeImageStyle = useAnimatedStyle(() => {
    if (openProgress.value === 1) {
      return {
        transform: [{translateY: dismissSwipeTranslateY.value}],
      }
    }
    if (thumbDims) {
      const interpolatedTransform = interpolateTransform(
        openProgress.value,
        thumbDims,
        SCREEN,
      )
      return {
        transform: interpolatedTransform,
      }
    }
    return {
      transform: [],
    }
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
        dismissSwipeTranslateY.value = withDecay({velocity: e.velocityY})
        runOnJS(onRequestClose)()
      } else {
        dismissSwipeTranslateY.value = withSpring(0, {
          stiffness: 700,
          damping: 50,
        })
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

  if (!visible) {
    return null
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={edges}
      aria-modal
      accessibilityViewIsModal>
      <View style={[styles.container]}>
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
            setIsDragging(e.nativeEvent.pageScrollState !== 'idle')
          }}
          overdrag={true}
          style={styles.pager}>
          {images.map((imageSrc, i) => (
            <Animated.View
              key={imageSrc.uri}
              style={imageIndex === i ? activeImageStyle : null}>
              <ImageItem
                onTap={onTap}
                onZoom={onZoom}
                imageSrc={imageSrc}
                onRequestClose={onRequestClose}
                isScrollViewBeingDragged={isDragging}
                showControls={showControls}
                dismissSwipePan={
                  imageIndex === i && !isDragging ? dismissSwipePan : null
                }
              />
            </Animated.View>
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
      </View>
    </SafeAreaView>
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

function interpolateTransform(
  progress: number,
  thumbnailDims: {
    pageX: number
    width: number
    pageY: number
    height: number
  },
  screenSize: {width: number; height: number},
) {
  'worklet'
  const screenCenterX = screenSize.width / 2
  const screenCenterY = screenSize.height / 2
  const thumbnailCenterX = thumbnailDims.pageX + thumbnailDims.width / 2
  const thumbnailCenterY = thumbnailDims.pageY + thumbnailDims.height / 2

  const initialScale = thumbnailDims.width / screenSize.width
  const initialTranslateX = (thumbnailCenterX - screenCenterX) / initialScale
  const initialTranslateY = (thumbnailCenterY - screenCenterY) / initialScale

  const scale = interpolate(progress, [0, 1], [initialScale, 1])
  const translateX = interpolate(progress, [0, 1], [initialTranslateX, 0])
  const translateY = interpolate(progress, [0, 1], [initialTranslateY, 0])
  return [{scale}, {translateX}, {translateY}]
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

const EnhancedImageViewing = (props: Props) => (
  <ImageViewing key={props.initialImageIndex} {...props} />
)

function withClampedSpring(value: any) {
  'worklet'
  return withSpring(value, {overshootClamping: true, stiffness: 150})
}

export default EnhancedImageViewing
