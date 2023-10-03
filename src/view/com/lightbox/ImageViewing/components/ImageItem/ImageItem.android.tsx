import React, {useCallback, useRef, useEffect, useState} from 'react'

import {
  ActivityIndicator,
  View,
  Dimensions,
  StyleSheet,
} from 'react-native'
import {Image} from 'expo-image'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {
  GestureDetector,
  Gesture
} from 'react-native-gesture-handler'

const AnimatedImage = Animated.createAnimatedComponent(Image)

import useImageDimensions from '../../hooks/useImageDimensions'

import {ImageSource} from '../../@types'

const SCREEN = Dimensions.get('window')
const MIN_DOUBLE_TAP_SCALE = 2
const MAX_ORIGINAL_IMAGE_ZOOM = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onZoom: (isZoomed: boolean) => void
  onLongPress: (image: ImageSource) => void
  delayLongPress: number
  swipeToCloseEnabled?: boolean
  doubleTapToZoomEnabled?: boolean
}

 type Matrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

function createTransform(): Matrix3 {
  'worklet'
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function prependTranslate(t: Matrix3, x: number, y: number) {
  "worklet";
  t[2] += t[0] * x + t[1] * y;
  t[5] += t[3] * x + t[4] * y;
}

function prependScale(t: Matrix3, value: number) {
  'worklet'
  t[0] *= value;
  t[1] *= value;
  t[3] *= value;
  t[4] *= value;
}

function prependTransform(ta: Matrix3, tb: Matrix3) {
  "worklet";
  const a00 = ta[0], a01 = ta[1], a02 = ta[2];
  const a10 = ta[3], a11 = ta[4], a12 = ta[5];
  const a20 = ta[6], a21 = ta[7], a22 = ta[8];
  ta[0] = a00 * tb[0] + a01 * tb[3] + a02 * tb[6];
  ta[1] = a00 * tb[1] + a01 * tb[4] + a02 * tb[7];
  ta[2] = a00 * tb[2] + a01 * tb[5] + a02 * tb[8];
  ta[3] = a10 * tb[0] + a11 * tb[3] + a12 * tb[6];
  ta[4] = a10 * tb[1] + a11 * tb[4] + a12 * tb[7];
  ta[5] = a10 * tb[2] + a11 * tb[5] + a12 * tb[8];
  ta[6] = a20 * tb[0] + a21 * tb[3] + a22 * tb[6];
  ta[7] = a20 * tb[1] + a21 * tb[4] + a22 * tb[7];
  ta[8] = a20 * tb[2] + a21 * tb[5] + a22 * tb[8];
}

function readTransform(t): [number, number, number] {
  'worklet'
  const scale = t[0]
  const translateX = t[2]
  const translateY = t[5]
  return [translateX, translateY, scale]
}

function prependPan(t, translation) {
  'worklet'
  prependTranslate(t, translation.x, translation.y);
}

function prependPinch(t, scale, origin, translation) {
  'worklet'
  prependTranslate(t, translation.x, translation.y);
  prependTranslate(t, origin.x, origin.y);
  prependScale(t, scale);
  prependTranslate(t, -origin.x, -origin.y);
}

function applyRounding(t) {
  'worklet'
  t[2] = Math.round(t[2])
  t[5] = Math.round(t[5])
  t[0] = Math.round(t[0] * 200) / 200;
  t[4] = Math.round(t[0] * 200) / 200;
}

function getScaledDimensions(imageDimensions, scale) {
  'worklet'
  const imageAspect = imageDimensions.width / imageDimensions.height
  const screenAspect = SCREEN.width / SCREEN.height
  const isLandscape = imageAspect > screenAspect
  if (isLandscape) {
    return {
      width: scale * SCREEN.width,
      height: scale * SCREEN.width / imageAspect
    }
  } else {
    return {
      width: scale * SCREEN.height * imageAspect,
      height: scale * SCREEN.height
    }
  }
}

function clampTranslation(value, scaledSize, screenSize) {
  'worklet'
  const panDistance = Math.max(0, (scaledSize - screenSize) / 2)
  const clampedValue = Math.min(Math.max(-panDistance, value), panDistance)
  return clampedValue
}

function withClampedSpring(value) {
  'worklet'
  return withSpring(value, { overshootClamping: true })
}

const initialTransform = createTransform();

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
}: Props) => {
  const [isScaled, setIsScaled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imageDimensions = useImageDimensions(imageSrc)
  const committedTransform = useSharedValue(initialTransform)
  const pinchOrigin = useSharedValue({ x: 0, y: 0 })
  const pinchScale = useSharedValue(1)
  const pinchTranslation = useSharedValue({ x: 0, y: 0 })
  const panTranslation = useSharedValue({ x: 0, y: 0 })
  const dismissSwipeTranslateY = useSharedValue(0)

  useAnimatedReaction(
    () => {
      if (pinchScale.value !== 1) {
        return true;
      }
      const [,,committedScale] = readTransform(committedTransform.value)
      if (committedScale !== 1) {
        return true;
      }
      return false;
    },
    (nextIsScaled, prevIsScaled) => {
      if (nextIsScaled !== prevIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
    }
  )

  function handleZoom(nextIsScaled) {
    setIsScaled(nextIsScaled)
    onZoom(nextIsScaled)
  }

  const animatedStyle = useAnimatedStyle(() => {
    let t = createTransform();
    prependPan(t, panTranslation.value);
    prependPinch(t, pinchScale.value, pinchOrigin.value, pinchTranslation.value);
    prependTransform(t, committedTransform.value);
    const [translateX, translateY, scale] = readTransform(t)
    const dismissDistance = dismissSwipeTranslateY.value
    const dismissProgress = Math.min(Math.abs(dismissDistance) / (SCREEN.height/2), 1);
    return {
      opacity: 1 - dismissProgress,
      transform: [
        { translateX },
        { translateY: translateY + dismissDistance },
        { scale }
      ],
    };
  })

  function getPanAdjustment(candidateTransform) {
    'worklet';
    if (!imageDimensions) {
      return [0, 0]
    }
    const [nextTranslateX, nextTranslateY, nextScale] = readTransform(candidateTransform)
    const scaledDimensions = getScaledDimensions(imageDimensions, nextScale)
    const clampedTranslateX = clampTranslation(nextTranslateX, scaledDimensions.width, SCREEN.width)
    const clampedTranslateY = clampTranslation(nextTranslateY, scaledDimensions.height, SCREEN.height)
    const dx = clampedTranslateX - nextTranslateX
    const dy = clampedTranslateY - nextTranslateY
    return [dx, dy]
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      pinchOrigin.value = {
        x: e.focalX - SCREEN.width/2,
        y: e.focalY - SCREEN.height/2
      };
    })
    .onChange((e) => {
      if (!imageDimensions) {
        return;
      }
      const [,,committedScale] = readTransform(committedTransform.value)
      const maxCommittedScale = (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
      const minPinchScale = 1 / committedScale;
      const maxPinchScale = maxCommittedScale / committedScale;
      const nextPinchScale = Math.min(Math.max(minPinchScale, e.scale), maxPinchScale);
      pinchScale.value = nextPinchScale

      const t = createTransform();
      prependPan(t, panTranslation.value)
      prependPinch(t, nextPinchScale, pinchOrigin.value, pinchTranslation.value);
      prependTransform(t, committedTransform.value)
      const [dx, dy] = getPanAdjustment(t)
      if (dx !== 0 || dy !== 0) {
        pinchTranslation.value = {
          x: pinchTranslation.value.x + dx,
          y: pinchTranslation.value.y + dy
        }
      }
    })
    .onEnd(() => {
      let t = createTransform();
      prependPinch(t, pinchScale.value, pinchOrigin.value, pinchTranslation.value)
      prependTransform(t, committedTransform.value);
      applyRounding(t)
      committedTransform.value = t
      pinchScale.value = 1;
      pinchOrigin.value = { x: 0, y: 0 };
      pinchTranslation.value = { x: 0, y: 0 };
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((e) => {
      if (!imageDimensions) {
        return;
      }
      const nextPanTranslation = { x: e.translationX, y: e.translationY }
      let t = createTransform();
      prependPan(t, nextPanTranslation)
      prependPinch(t, pinchScale.value, pinchOrigin.value, pinchTranslation.value);
      prependTransform(t, committedTransform.value)
      const [dx, dy] = getPanAdjustment(t)
      nextPanTranslation.x += dx
      nextPanTranslation.y += dy
      panTranslation.value = nextPanTranslation;
    })
    .onEnd(() => {
      let t = createTransform();
      prependPan(t, panTranslation.value)
      prependTransform(t, committedTransform.value);
      applyRounding(t)
      committedTransform.value = t
      panTranslation.value = { x: 0, y: 0 };
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (!imageDimensions) {
        return;
      }
      const [,,committedScale] = readTransform(committedTransform.value)
      if (committedScale !== 1) {
        let t = createTransform();
        committedTransform.value = withClampedSpring(t)
        return;
      }
      const origin = {
        x: e.absoluteX - SCREEN.width/2,
        y: e.absoluteY - SCREEN.height/2
      };
      const imageAspect = imageDimensions.width / imageDimensions.height
      const screenAspect = SCREEN.width / SCREEN.height
      const candidateScale = Math.max(imageAspect / screenAspect, screenAspect / imageAspect, MIN_DOUBLE_TAP_SCALE)
      const maxScale = (imageDimensions.width / SCREEN.width) * MAX_ORIGINAL_IMAGE_ZOOM
      const scale = Math.min(candidateScale, maxScale)
      const candidateTransform = createTransform();
      prependPinch(candidateTransform, scale, origin, {x: 0, y: 0})
      const [dx, dy] = getPanAdjustment(candidateTransform)
      const finalTransform = createTransform();
      prependPinch(finalTransform, scale, origin, {x: dx, y: dy})
      committedTransform.value = withClampedSpring(finalTransform)
    });

  const dismissSwipePan = Gesture.Pan()
    .enabled(!isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate(e => {
      dismissSwipeTranslateY.value = e.translationY
    })
    .onEnd((e) => {
      if (Math.abs(e.velocityY) > 1000) {
        dismissSwipeTranslateY.value = withDecay({ velocity: e.velocityY })
        runOnJS(onRequestClose)();
      } else {
        dismissSwipeTranslateY.value = withSpring(0, {
          stiffness: 700,
          damping: 50
        })
      }
    });

  const isLoading = !isLoaded || !imageDimensions;
  return (
    <View
      style={styles.container}>
      {isLoading && <ActivityIndicator size="small" color="#FFF" style={styles.loading} />}
      <GestureDetector gesture={Gesture.Exclusive(dismissSwipePan, Gesture.Simultaneous(pinch, pan), doubleTap)}>
        <AnimatedImage
          source={imageSrc}
          contentFit="contain"
          style={[styles.image, animatedStyle]}
          accessibilityLabel={imageSrc.alt}
          accessibilityHint=""
          onLoad={() => setIsLoaded(true)}
        >
        </AnimatedImage>
      </GestureDetector>
    </View>
    )
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN.width,
    height: SCREEN.height,
  },
  image: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
})

export default React.memo(ImageItem)
