import {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {Circle as SvgCircle} from 'react-native-svg'

import {clamp01} from './shared'

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle)

export function ProgressCircle({
  progress,
  size,
  color,
  thickness = 3,
  borderWidth = 1,
  borderColor,
  unfilledColor,
}: {
  progress: number
  size: number
  color: string
  thickness?: number
  borderWidth?: number
  borderColor?: string
  unfilledColor?: string
}) {
  const stroke = borderColor ?? color
  const r = (size - Math.max(borderWidth, thickness)) / 2
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const sv = useSharedValue(clamp01(progress))

  useEffect(() => {
    sv.set(
      withTiming(clamp01(progress), {
        duration: 200,
        easing: Easing.out(Easing.quad),
      }),
    )
  }, [progress, sv])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sv.get()),
  }))

  return (
    <Svg width={size} height={size}>
      {borderWidth > 0 && (
        <SvgCircle
          cx={cx}
          cy={cx}
          r={r}
          stroke={stroke}
          strokeWidth={borderWidth}
          fill="none"
        />
      )}
      {unfilledColor && (
        <SvgCircle
          cx={cx}
          cy={cx}
          r={r}
          stroke={unfilledColor}
          strokeWidth={thickness}
          fill="none"
        />
      )}
      <AnimatedCircle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </Svg>
  )
}
