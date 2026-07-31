import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  Easing,
  LayoutAnimationConfig,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated'

import {decideShouldRoll} from '#/lib/custom-animations/util'
import {atoms as a} from '#/alf'

const animationConfig = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
}

function EnteringUp() {
  'worklet'
  const animations = {
    opacity: withTiming(1, animationConfig),
    transform: [{translateY: withTiming(0, animationConfig)}],
  }
  const initialValues = {
    opacity: 0,
    transform: [{translateY: 18}],
  }
  return {
    animations,
    initialValues,
  }
}

function EnteringDown() {
  'worklet'
  const animations = {
    opacity: withTiming(1, animationConfig),
    transform: [{translateY: withTiming(0, animationConfig)}],
  }
  const initialValues = {
    opacity: 0,
    transform: [{translateY: -18}],
  }
  return {
    animations,
    initialValues,
  }
}

function ExitingUp() {
  'worklet'
  const animations = {
    opacity: withTiming(0, animationConfig),
    transform: [
      {
        translateY: withTiming(-18, animationConfig),
      },
    ],
  }
  const initialValues = {
    opacity: 1,
    transform: [{translateY: 0}],
  }
  return {
    animations,
    initialValues,
  }
}

function ExitingDown() {
  'worklet'
  const animations = {
    opacity: withTiming(0, animationConfig),
    transform: [{translateY: withTiming(18, animationConfig)}],
  }
  const initialValues = {
    opacity: 1,
    transform: [{translateY: 0}],
  }
  return {
    animations,
    initialValues,
  }
}

export function CountWheel({
  count,
  isToggled,
  hasBeenToggled,
  renderCount,
}: {
  count: number
  isToggled: boolean
  hasBeenToggled: boolean
  renderCount: (props: {count: number}) => React.ReactNode
}) {
  const shouldAnimate = !useReducedMotion() && hasBeenToggled
  const shouldRoll = decideShouldRoll(isToggled, count)

  // Incrementing the key will cause the `Animated.View` to re-render, with the newly selected entering/exiting
  // animation
  // The initial entering/exiting animations will get skipped, since these will happen on screen mounts and would
  // be unnecessary
  const [key, setKey] = useState(0)
  const [prevCount, setPrevCount] = useState(count)
  const prevIsToggled = useRef(isToggled)

  useEffect(() => {
    if (isToggled === prevIsToggled.current) {
      return
    }

    const newPrevCount = isToggled ? count - 1 : count + 1
    setKey(prev => prev + 1)
    setPrevCount(newPrevCount)
    prevIsToggled.current = isToggled
  }, [isToggled, count])

  const enteringAnimation =
    shouldAnimate && shouldRoll
      ? isToggled
        ? EnteringUp
        : EnteringDown
      : undefined
  const exitingAnimation =
    shouldAnimate && shouldRoll
      ? isToggled
        ? ExitingUp
        : ExitingDown
      : undefined

  return (
    <LayoutAnimationConfig skipEntering skipExiting>
      {count > 0 ? (
        <View style={[a.justify_center]}>
          <Animated.View entering={enteringAnimation} key={key}>
            {renderCount({count})}
          </Animated.View>
          {shouldAnimate && (count > 1 || !isToggled) ? (
            <Animated.View
              entering={exitingAnimation}
              // Add 2 to the key so there are never duplicates
              key={key + 2}
              style={[a.absolute, {width: 50, opacity: 0}]}
              aria-disabled={true}>
              {renderCount({count: prevCount})}
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </LayoutAnimationConfig>
  )
}
