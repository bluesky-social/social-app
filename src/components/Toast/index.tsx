import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {AccessibilityInfo, View} from 'react-native'
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
import {Motion} from '@legendapp/motion'
import {nanoid} from 'nanoid/non-secure'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Context} from '#/components/Toast/Context'
import * as Portal from '#/components/Toast/Portal'
import {Toast} from '#/components/Toast/Toast'
import {
  type ToastApi,
  type ToastProps,
  type ToastType,
} from '#/components/Toast/types'

export {useToast} from '#/components/Toast/Context'
export {Outlet} from '#/components/Toast/Portal'

const TOAST_ANIMATION_DURATION = 300
const ANIMATION_DURATION = 300
const TOAST_GAP = 8 // Gap between toasts

export function ToastProvider({
  children,
  offsetTop,
}: {
  children: React.ReactNode
  offsetTop?: number
}) {
  const {top} = useSafeAreaInsets()
  const [toasts, setToasts] = useState<
    {
      id: string
      props: ToastProps
      dimensions: {
        width: number | undefined
        height: number | undefined
      }
      setDimensions: (width: number, height: number) => void
      exiting: boolean
      timers: NodeJS.Timeout[]
    }[]
  >([])

  const show = useCallback<ToastApi['show']>(props => {
    setToasts(prevToasts => {
      const id = nanoid()
      const duration = props.duration || DEFAULT_TOAST_DURATION
      return [
        ...prevToasts,
        {
          id,
          props,
          dimensions: {width: undefined, height: undefined},
          exiting: false,
          setDimensions: (width: number, height: number) => {
            setToasts(currentToasts =>
              currentToasts.map(t => {
                if (t.id === id) {
                  t.dimensions.width = width
                  t.dimensions.height = height
                }
                return t
              }),
            )
          },
          timers: [
            setTimeout(() => {
              setToasts(currentToasts =>
                currentToasts.map(t => {
                  if (t.id === id) {
                    t.exiting = true
                  }
                  return t
                }),
              )
            }, duration),
            setTimeout(() => {
              setToasts(currentToasts => currentToasts.filter(t => t.id !== id))
            }, duration + ANIMATION_DURATION),
          ],
        },
      ]
    })
  }, [])

  useEffect(() => {
    return () => {
      setToasts(toasts => {
        toasts.map(({timers}) => {
          timers.map(clearTimeout)
        })
        return toasts
      })
    }
  }, [])

  const ctx = useMemo(
    () => ({
      show,
    }),
    [show],
  )

  return (
    <Context.Provider value={ctx}>
      <Portal.Provider>
        {children}

        {toasts.length ? (
          <Portal.Portal>
            <View
              style={[
                a.absolute,
                {
                  top: offsetTop ?? top,
                  left: a.px_lg.paddingLeft,
                  right: a.px_lg.paddingLeft,
                },
              ]}>
              {toasts.map(toast => {
                const isReady = !!toast.dimensions.width
                const toastComponent = (
                  <Toast
                    content={toast.props.content}
                    type={toast.props.type}
                  />
                )

                if (!isReady) {
                  return (
                    <View key={toast.id} style={[{opacity: 0}]}>
                      <View
                        style={[{paddingBottom: TOAST_GAP}]}
                        onLayout={e => {
                          if (toast.dimensions.width) return
                          toast.setDimensions(
                            e.nativeEvent.layout.width,
                            e.nativeEvent.layout.height,
                          )
                        }}>
                        {toastComponent}
                      </View>
                    </View>
                  )
                }

                return (
                  <Motion.View
                    key={toast.id}
                    initial={{opacity: 0, y: 20}}
                    animate={{
                      y: 0,
                      opacity: toast.exiting ? 0 : 1,
                      height: toast.exiting ? 0 : toast.dimensions.height,
                    }}
                    transition={{
                      type: 'timing',
                      easing: 'circOut',
                      duration: ANIMATION_DURATION,
                    }}>
                    <View
                      key={toast.id}
                      style={[
                        {
                          position: toast.exiting ? 'absolute' : 'relative',
                          width: toast.dimensions.width,
                          height: toast.dimensions.height,
                          paddingBottom: TOAST_GAP,
                        },
                      ]}>
                      <Toast
                        content={toast.props.content}
                        type={toast.props.type}
                      />
                    </View>
                  </Motion.View>
                )
              })}
            </View>
          </Portal.Portal>
        ) : null}
      </Portal.Provider>
    </Context.Provider>
  )
}

export function ToastContainer() {
  return null
}

export const toast: ToastApi = {
  show(props) {
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
