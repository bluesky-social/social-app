import {useEffect, useMemo, useRef, useState} from 'react'
import {AccessibilityInfo, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  FontAwesomeIcon,
  type Props as FontAwesomeProps,
} from '@fortawesome/react-native-fontawesome'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const TIMEOUT = 2e3

type ToastProps = {
  message: string
  icon: FontAwesomeProps['icon']
}

const SHOW_TOAST = 'show-toast'

const ToastEventEmitter = new EventEmitter<typeof SHOW_TOAST>()

export function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastProps & {key: string})[]>([])

  useEffect(() => {
    const listener = ({message, icon}: ToastProps) => {
      console.log('Adding toast', message)
      setToasts(prev => [...prev, {message, icon, key: nanoid()}])
    }
    ToastEventEmitter.on(SHOW_TOAST, listener)
    return () => {
      ToastEventEmitter.off(SHOW_TOAST, listener)
    }
  }, [])

  console.log('toasts', toasts.length)

  return toasts.map(toast => (
    <Toast
      {...toast}
      key={toast.key}
      destroy={() => setToasts(prev => prev.filter(t => t !== toast))}
    />
  ))
}

export function show(
  message: string,
  icon: FontAwesomeProps['icon'] = 'check',
) {
  if (process.env.NODE_ENV === 'test') {
    return
  }
  AccessibilityInfo.announceForAccessibility(message)
  ToastEventEmitter.emit(SHOW_TOAST, {message, icon})
}

function Toast({
  message,
  icon,
  destroy,
}: {
  message: string
  icon: FontAwesomeProps['icon']
  destroy: () => void
}) {
  const t = useTheme()
  const {top} = useSafeAreaInsets()
  const isPanning = useSharedValue(false)
  const animationTranslateY = useSharedValue(-200)
  const dismissSwipeTranslateY = useSharedValue(0)
  const [cardHeight, setCardHeight] = useState(0)

  const hideAndDestroyImmediately = () => {
    'worklet'
    animationTranslateY.set(
      withSpring(
        -200,
        {
          damping: 100,
          stiffness: 800,
          restDisplacementThreshold: 0.01,
        },
        () => runOnJS(destroy)(),
      ),
    )
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
    animationTranslateY.set(
      withSpring(0, {
        damping: 100,
        stiffness: 800,
        restDisplacementThreshold: 0.01,
      }),
    )
    hideAndDestroyAfterTimeout()
  }, [hideAndDestroyAfterTimeout, animationTranslateY])

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-10, 10])
      .maxPointers(1)
      .onStart(() => {
        'worklet'
        isPanning.set(true)
        runOnJS(pauseDestroy)()
      })
      .onUpdate(e => {
        'worklet'
        dismissSwipeTranslateY.value = e.translationY
      })
      .onEnd(e => {
        'worklet'
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
            damping: 75,
            stiffness: 1000,
            restDisplacementThreshold: 0.01,
          })
        }
      })
  }, [
    dismissSwipeTranslateY,
    isPanning,
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
    const translation = dismissSwipeTranslateY.get() + animationTranslateY.get()
    return {
      transform: [
        {
          translateY: translation > 0 ? translation ** 0.7 : translation,
        },
      ],
    }
  })

  return (
    <Animated.View
      onLayout={evt => setCardHeight(evt.nativeEvent.layout.height)}
      accessibilityRole="alert"
      accessible={true}
      accessibilityLabel={message}
      accessibilityHint=""
      onAccessibilityEscape={hideAndDestroyImmediately}
      style={[
        a.absolute,
        {top: topOffset, left: 16, right: 16},
        a.flex_1,
        t.name === 'dark' ? t.atoms.bg_contrast_25 : t.atoms.bg,
        a.shadow_lg,
        t.atoms.border_contrast_medium,
        a.rounded_sm,
        a.border,
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
                backgroundColor:
                  t.name === 'dark' ? t.palette.black : t.palette.primary_50,
              },
            ]}>
            <FontAwesomeIcon
              icon={icon}
              size={16}
              style={t.atoms.text_contrast_medium}
            />
          </View>
          <View style={[a.h_full, a.justify_center, a.flex_1]}>
            <Text style={a.text_md} emoji>
              {message}
            </Text>
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  )
}
