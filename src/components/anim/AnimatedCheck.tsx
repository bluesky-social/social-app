import React from 'react'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import Svg, {Circle, Path} from 'react-native-svg'

import {Props, useCommonSVGProps} from '#/components/icons/common'

const AnimatedPath = Animated.createAnimatedComponent(Path)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const PATH = 'M14.1 27.2l7.1 7.2 16.7-16.8'

export interface AnimatedCheckRef {
  play(cb?: () => void): void
}

export interface AnimatedCheckProps extends Props {
  playOnMount?: boolean
}

export const AnimatedCheck = React.forwardRef<
  AnimatedCheckRef,
  AnimatedCheckProps
>(function AnimatedCheck({playOnMount, ...props}, ref) {
  const {fill, size, style, ...rest} = useCommonSVGProps(props)
  const circleAnim = useSharedValue(0)
  const checkAnim = useSharedValue(0)

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 166 - circleAnim.get() * 166,
  }))
  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 48 - 48 * checkAnim.get(),
  }))

  const play = React.useCallback(
    (cb?: () => void) => {
      circleAnim.set(0)
      checkAnim.set(0)

      circleAnim.set(() =>
        withTiming(1, {duration: 500, easing: Easing.linear}),
      )
      checkAnim.set(() =>
        withDelay(
          500,
          withTiming(1, {duration: 300, easing: Easing.linear}, cb),
        ),
      )
    },
    [circleAnim, checkAnim],
  )

  React.useImperativeHandle(ref, () => ({
    play,
  }))

  React.useEffect(() => {
    if (playOnMount) {
      play()
    }
  }, [play, playOnMount])

  return (
    <Svg
      fill="none"
      {...rest}
      viewBox="0 0 52 52"
      width={size}
      height={size}
      style={style}>
      <AnimatedCircle
        animatedProps={circleAnimatedProps}
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke={fill}
        strokeWidth={4}
        strokeDasharray={166}
      />
      <AnimatedPath
        animatedProps={checkAnimatedProps}
        stroke={fill}
        d={PATH}
        strokeWidth={4}
        strokeDasharray={48}
      />
    </Svg>
  )
})
