import {useEffect, useMemo, useRef, useState} from 'react'
import {AccessibilityInfo, View} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import RootSiblings from 'react-native-root-siblings'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  getToastTypeStyles,
  TOAST_ANIMATION_CONFIG,
  TOAST_TYPE_TO_ICON,
  type ToastType,
} from '#/view/com/util/Toast.style'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const TIMEOUT = 2e3

export function show(message: string, type: ToastType = 'default') {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  AccessibilityInfo.announceForAccessibility(message)
  const item = new RootSiblings(
    <Toast message={message} type={type} destroy={() => item.destroy()} />,
  )
}

function Toast({
  message,
  type,
  destroy,
}: {
  message: string
  type: ToastType
  destroy: () => void
}) {
  const t = useTheme()
  const {top} = useSafeAreaInsets()
  const isPanning = useSharedValue(false)
  const dismissSwipeTranslateY = useSharedValue(0)
  const [cardHeight, setCardHeight] = useState(0)

  const toastStyles = getToastTypeStyles(t)
  const colors = toastStyles[type]
  const IconComponent = TOAST_TYPE_TO_ICON[type]

  // for the exit animation to work on iOS the animated component
  // must not be the root component
  // so we need to wrap it in a view and unmount the toast ahead of time
  const [alive, setAlive] = useState(true)

  const hideAndDestroyImmediately = () => {
    setAlive(false)
    setTimeout(() => {
      destroy()
    }, 1e3)
  }

  const destroyTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const hideAndDestroyAfterTimeout = useNonReactiveCallback(() => {
    clearTimeout(destroyTimeoutRef.current)
    destroyTimeoutRef.current = setTimeout(hideAndDestroyImmediately, TIMEOUT)
  })
  const pauseDestroy = useNonReactiveCallback(() => {
    clearTimeout(destroyTimeoutRef.current)
  })

  useEffect(() => {
    hideAndDestroyAfterTimeout()
  }, [hideAndDestroyAfterTimeout])

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-10, 10])
      .maxPointers(1)
      .onStart(() => {
        'worklet'
        if (!alive) return
        isPanning.set(true)
        runOnJS(pauseDestroy)()
      })
      .onUpdate(e => {
        'worklet'
        if (!alive) return
        dismissSwipeTranslateY.value = e.translationY
      })
      .onEnd(e => {
        'worklet'
        if (!alive) return
        runOnJS(hideAndDestroyAfterTimeout)()
        isPanning.set(false)
        if (e.velocityY < -100) {
          if (dismissSwipeTranslateY.value === 0) {
            // HACK: If the initial value is 0, withDecay() animation doesn't start.
            // This is a bug in Reanimated, but for now we'll work around it like this.
            dismissSwipeTranslateY.value = 1
          }
          dismissSwipeTranslateY.value = withDecay({
            velocity: e.velocityY,
            velocityFactor: Math.max(3500 / Math.abs(e.velocityY), 1),
            deceleration: 1,
          })
        } else {
          dismissSwipeTranslateY.value = withSpring(0, {
            stiffness: 500,
            damping: 50,
          })
        }
      })
  }, [
    dismissSwipeTranslateY,
    isPanning,
    alive,
    hideAndDestroyAfterTimeout,
    pauseDestroy,
  ])

  const topOffset = top + 10

  useAnimatedReaction(
    () =>
      !isPanning.get() &&
      dismissSwipeTranslateY.get() < -topOffset - cardHeight,
    (isSwipedAway, prevIsSwipedAway) => {
      'worklet'
      if (isSwipedAway && !prevIsSwipedAway) {
        runOnJS(destroy)()
      }
    },
  )

  const animatedStyle = useAnimatedStyle(() => {
    const translation = dismissSwipeTranslateY.get()
    return {
      transform: [
        {
          translateY: translation > 0 ? translation ** 0.7 : translation,
        },
      ],
    }
  })

  return (
    <GestureHandlerRootView
      style={[a.absolute, {top: topOffset, left: 16, right: 16}]}
      pointerEvents="box-none">
      {alive && (
        <Animated.View
          entering={FadeIn.duration(TOAST_ANIMATION_CONFIG.duration)}
          exiting={FadeOut.duration(TOAST_ANIMATION_CONFIG.duration * 0.7)}
          onLayout={evt => setCardHeight(evt.nativeEvent.layout.height)}
          accessibilityRole="alert"
          accessible={true}
          accessibilityLabel={message}
          accessibilityHint=""
          onAccessibilityEscape={hideAndDestroyImmediately}
          style={[
            a.flex_1,
            {backgroundColor: colors.backgroundColor},
            a.shadow_sm,
            {borderColor: colors.borderColor, borderWidth: 1},
            a.rounded_sm,
            animatedStyle,
          ]}>
          <GestureDetector gesture={panGesture}>
            <View style={[a.flex_1, a.px_md, a.py_lg, a.flex_row, a.gap_md]}>
              <View
                style={[
                  a.flex_shrink_0,
                  a.rounded_full,
                  {width: 32, height: 32},
                  a.align_center,
                  a.justify_center,
                  {
                    backgroundColor: colors.backgroundColor,
                  },
                ]}>
                <IconComponent fill={colors.iconColor} size="sm" />
              </View>
              <View
                style={[
                  a.h_full,
                  a.justify_center,
                  a.flex_1,
                  a.justify_center,
                ]}>
                <Text
                  style={[a.text_md, a.font_bold, {color: colors.textColor}]}
                  emoji>
                  {message}
                </Text>
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  )
}
