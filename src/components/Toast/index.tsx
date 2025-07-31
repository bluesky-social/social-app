import {useEffect, useMemo, useRef, useState} from 'react'
import {AccessibilityInfo} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  SlideInUp,
  SlideOutUp,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated'
import RootSiblings from 'react-native-root-siblings'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Toast} from '#/components/Toast/Toast'
import {type ToastApi, type ToastType} from '#/components/Toast/types'

const TOAST_ANIMATION_DURATION = 300

export function ToastContainer() {
  return null
}

export const toast: ToastApi = {
  show(props) {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    AccessibilityInfo.announceForAccessibility(props.a11yLabel)

    const item = new RootSiblings(
      (
        <AnimatedToast
          type={props.type}
          content={props.content}
          a11yLabel={props.a11yLabel}
          duration={props.duration ?? DEFAULT_TOAST_DURATION}
          destroy={() => item.destroy()}
        />
      ),
    )
  },
}

function AnimatedToast({
  type,
  content,
  a11yLabel,
  duration,
  destroy,
}: {
  type: ToastType
  content: React.ReactNode
  a11yLabel: string
  duration: number
  destroy: () => void
}) {
  const {top} = useSafeAreaInsets()
  const isPanning = useSharedValue(false)
  const dismissSwipeTranslateY = useSharedValue(0)
  const [cardHeight, setCardHeight] = useState(0)

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
    destroyTimeoutRef.current = setTimeout(hideAndDestroyImmediately, duration)
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
          entering={SlideInUp.easing(Easing.out(Easing.exp)).duration(
            TOAST_ANIMATION_DURATION,
          )}
          exiting={SlideOutUp.easing(Easing.in(Easing.exp)).duration(
            TOAST_ANIMATION_DURATION * 0.7,
          )}
          onLayout={evt => setCardHeight(evt.nativeEvent.layout.height)}
          accessibilityRole="alert"
          accessible={true}
          accessibilityLabel={a11yLabel}
          accessibilityHint=""
          onAccessibilityEscape={hideAndDestroyImmediately}
          style={[a.flex_1, animatedStyle]}>
          <GestureDetector gesture={panGesture}>
            <Toast content={content} type={type} />
          </GestureDetector>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  )
}
