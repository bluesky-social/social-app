import React from 'react'
import {ColorValue, Dimensions, StyleSheet, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from '#/lib/haptics'

interface GestureAction {
  color: ColorValue
  action: () => void
  threshold: number
  icon: React.ElementType
}

interface GestureActions {
  leftFirst?: GestureAction
  leftSecond?: GestureAction
  rightFirst?: GestureAction
  rightSecond?: GestureAction
}

const MAX_WIDTH = Dimensions.get('screen').width
const ICON_SIZE = 32

export function GestureActionView({
  children,
  actions,
}: {
  children: React.ReactNode
  actions: GestureActions
}) {
  if (
    (actions.leftSecond && !actions.leftFirst) ||
    (actions.rightSecond && !actions.rightFirst)
  ) {
    throw new Error(
      'You must provide the first action before the second action',
    )
  }

  const [activeAction, setActiveAction] = React.useState<
    'leftFirst' | 'leftSecond' | 'rightFirst' | 'rightSecond' | null
  >(null)

  const haptic = useHaptics()
  const isReducedMotion = useReducedMotion()

  const transX = useSharedValue(0)
  const clampedTransX = useDerivedValue(() => {
    const min = actions.leftFirst ? -MAX_WIDTH : 0
    const max = actions.rightFirst ? MAX_WIDTH : 0
    return clamp(transX.get(), min, max)
  })

  const iconScale = useSharedValue(1)
  const isActive = useSharedValue(false)
  const hitFirst = useSharedValue(false)
  const hitSecond = useSharedValue(false)

  const runPopAnimation = () => {
    'worklet'
    if (isReducedMotion) {
      return
    }

    iconScale.set(() =>
      withSequence(
        withTiming(1.2, {duration: 175}),
        withTiming(1, {duration: 100}),
      ),
    )
  }

  useAnimatedReaction(
    () => transX,
    () => {
      if (transX.get() === 0) {
        runOnJS(setActiveAction)(null)
      } else if (transX.get() < 0) {
        if (
          actions.leftSecond &&
          transX.get() <= -actions.leftSecond.threshold
        ) {
          if (activeAction !== 'leftSecond') {
            runOnJS(setActiveAction)('leftSecond')
          }
        } else if (activeAction !== 'leftFirst') {
          runOnJS(setActiveAction)('leftFirst')
        }
      } else if (transX.get() > 0) {
        if (
          actions.rightSecond &&
          transX.get() > actions.rightSecond.threshold
        ) {
          if (activeAction !== 'rightSecond') {
            runOnJS(setActiveAction)('rightSecond')
          }
        } else if (activeAction !== 'rightFirst') {
          runOnJS(setActiveAction)('rightFirst')
        }
      }
    },
  )

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    // Absurdly high value so it doesn't interfere with the pan gestures above (i.e., scroll)
    // reanimated doesn't offer great support for disabling y/x axes :/
    .activeOffsetY([-200, 200])
    .onStart(() => {
      'worklet'
      isActive.set(true)
    })
    .onChange(e => {
      'worklet'
      transX.set(e.translationX)

      if (e.translationX < 0) {
        // Left side
        if (actions.leftSecond) {
          if (
            e.translationX <= -actions.leftSecond.threshold &&
            !hitSecond.get()
          ) {
            runPopAnimation()
            runOnJS(haptic)()
            hitSecond.set(true)
          } else if (
            hitSecond.get() &&
            e.translationX > -actions.leftSecond.threshold
          ) {
            runPopAnimation()
            hitSecond.set(false)
          }
        }

        if (!hitSecond.get() && actions.leftFirst) {
          if (
            e.translationX <= -actions.leftFirst.threshold &&
            !hitFirst.get()
          ) {
            runPopAnimation()
            runOnJS(haptic)()
            hitFirst.set(true)
          } else if (
            hitFirst.get() &&
            e.translationX > -actions.leftFirst.threshold
          ) {
            hitFirst.set(false)
          }
        }
      } else if (e.translationX > 0) {
        // Right side
        if (actions.rightSecond) {
          if (
            e.translationX >= actions.rightSecond.threshold &&
            !hitSecond.get()
          ) {
            runPopAnimation()
            runOnJS(haptic)()
            hitSecond.set(true)
          } else if (
            hitSecond.get() &&
            e.translationX < actions.rightSecond.threshold
          ) {
            runPopAnimation()
            hitSecond.set(false)
          }
        }

        if (!hitSecond.get() && actions.rightFirst) {
          if (
            e.translationX >= actions.rightFirst.threshold &&
            !hitFirst.get()
          ) {
            runPopAnimation()
            runOnJS(haptic)()
            hitFirst.set(true)
          } else if (
            hitFirst.get() &&
            e.translationX < actions.rightFirst.threshold
          ) {
            hitFirst.set(false)
          }
        }
      }
    })
    .onEnd(e => {
      'worklet'
      if (e.translationX < 0) {
        if (hitSecond.get() && actions.leftSecond) {
          runOnJS(actions.leftSecond.action)()
        } else if (hitFirst.get() && actions.leftFirst) {
          runOnJS(actions.leftFirst.action)()
        }
      } else if (e.translationX > 0) {
        if (hitSecond.get() && actions.rightSecond) {
          runOnJS(actions.rightSecond.action)()
        } else if (hitSecond.get() && actions.rightFirst) {
          runOnJS(actions.rightFirst.action)()
        }
      }
      transX.set(() => withTiming(0, {duration: 200}))
      hitFirst.set(false)
      hitSecond.set(false)
      isActive.set(false)
    })

  const composedGesture = Gesture.Simultaneous(panGesture)

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: clampedTransX.get()}],
    }
  })

  const leftSideInterpolation = React.useMemo(() => {
    return createInterpolation({
      firstColor: actions.leftFirst?.color,
      secondColor: actions.leftSecond?.color,
      firstThreshold: actions.leftFirst?.threshold,
      secondThreshold: actions.leftSecond?.threshold,
      side: 'left',
    })
  }, [actions.leftFirst, actions.leftSecond])

  const rightSideInterpolation = React.useMemo(() => {
    return createInterpolation({
      firstColor: actions.rightFirst?.color,
      secondColor: actions.rightSecond?.color,
      firstThreshold: actions.rightFirst?.threshold,
      secondThreshold: actions.rightSecond?.threshold,
      side: 'right',
    })
  }, [actions.rightFirst, actions.rightSecond])

  const interpolation = React.useMemo<{
    inputRange: number[]
    outputRange: ColorValue[]
  }>(() => {
    if (!actions.leftFirst) {
      return rightSideInterpolation!
    } else if (!actions.rightFirst) {
      return leftSideInterpolation!
    } else {
      return {
        inputRange: [
          ...leftSideInterpolation.inputRange,
          ...rightSideInterpolation.inputRange,
        ],
        outputRange: [
          ...leftSideInterpolation.outputRange,
          ...rightSideInterpolation.outputRange,
        ],
      }
    }
  }, [
    leftSideInterpolation,
    rightSideInterpolation,
    actions.leftFirst,
    actions.rightFirst,
  ])

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        clampedTransX.get(),
        interpolation.inputRange,
        // @ts-expect-error - Weird type expected by reanimated, but this is okay
        interpolation.outputRange,
      ),
    }
  })

  const animatedIconStyle = useAnimatedStyle(() => {
    const absTransX = Math.abs(clampedTransX.get())
    return {
      opacity: interpolate(absTransX, [0, 75], [0.15, 1]),
      transform: [{scale: iconScale.get()}],
    }
  })

  return (
    <GestureDetector gesture={composedGesture}>
      <View>
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}>
          <View
            style={{
              flex: 1,
              marginHorizontal: 12,
              justifyContent: 'center',
              alignItems:
                activeAction === 'leftFirst' || activeAction === 'leftSecond'
                  ? 'flex-end'
                  : 'flex-start',
            }}>
            <Animated.View style={[animatedIconStyle]}>
              {activeAction === 'leftFirst' && actions.leftFirst?.icon ? (
                <actions.leftFirst.icon
                  height={ICON_SIZE}
                  width={ICON_SIZE}
                  style={{
                    color: 'white',
                  }}
                />
              ) : activeAction === 'leftSecond' && actions.leftSecond?.icon ? (
                <actions.leftSecond.icon
                  height={ICON_SIZE}
                  width={ICON_SIZE}
                  style={{color: 'white'}}
                />
              ) : activeAction === 'rightFirst' && actions.rightFirst?.icon ? (
                <actions.rightFirst.icon
                  height={ICON_SIZE}
                  width={ICON_SIZE}
                  style={{color: 'white'}}
                />
              ) : activeAction === 'rightSecond' &&
                actions.rightSecond?.icon ? (
                <actions.rightSecond.icon
                  height={ICON_SIZE}
                  width={ICON_SIZE}
                  style={{color: 'white'}}
                />
              ) : null}
            </Animated.View>
          </View>
        </Animated.View>
        <Animated.View style={animatedSliderStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  )
}

function createInterpolation({
  firstColor,
  secondColor,
  firstThreshold,
  secondThreshold,
  side,
}: {
  firstColor?: ColorValue
  secondColor?: ColorValue
  firstThreshold?: number
  secondThreshold?: number
  side: 'left' | 'right'
}): {
  inputRange: number[]
  outputRange: ColorValue[]
} {
  if ((secondThreshold && !secondColor) || (!secondThreshold && secondColor)) {
    throw new Error(
      'You must provide a second color if you provide a second threshold',
    )
  }

  if (!firstThreshold) {
    return {
      inputRange: [0],
      outputRange: ['transparent'],
    }
  }

  const offset = side === 'left' ? -20 : 20

  if (side === 'left') {
    firstThreshold = -firstThreshold

    if (secondThreshold) {
      secondThreshold = -secondThreshold
    }
  }

  let res
  if (secondThreshold) {
    res = {
      inputRange: [
        0,
        firstThreshold,
        firstThreshold + offset - 20,
        secondThreshold,
      ],
      outputRange: ['transparent', firstColor!, firstColor!, secondColor!],
    }
  } else {
    res = {
      inputRange: [0, firstThreshold],
      outputRange: ['transparent', firstColor!],
    }
  }

  if (side === 'left') {
    // Reverse the input/output ranges
    res.inputRange.reverse()
    res.outputRange.reverse()
  }

  return res
}
