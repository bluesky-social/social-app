import {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {Circle as SvgCircle, Path} from 'react-native-svg'

import {clamp01} from './shared'

const AnimatedPath = Animated.createAnimatedComponent(Path)

function describeWedge(cx: number, cy: number, r: number, progress: number) {
  'worklet'
  // avoid degenerate path at 360deg where start and end points collide
  const p = progress >= 1 ? 0.9999 : progress
  if (p <= 0) return ''
  const angle = p * 2 * Math.PI - Math.PI / 2
  const x = cx + r * Math.cos(angle)
  const y = cy + r * Math.sin(angle)
  const largeArc = p > 0.5 ? 1 : 0
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`
}

export function ProgressPie({
  progress,
  size,
  color,
  borderWidth = 1,
  borderColor,
}: {
  progress: number
  size: number
  color: string
  borderWidth?: number
  borderColor?: string
}) {
  const stroke = borderColor ?? color
  const r = (size - borderWidth) / 2
  const cx = size / 2
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
    d: describeWedge(cx, cx, r, sv.get()),
  }))

  return (
    <Svg width={size} height={size}>
      <SvgCircle
        cx={cx}
        cy={cx}
        r={r}
        stroke={stroke}
        strokeWidth={borderWidth}
        fill="none"
      />
      <AnimatedPath fill={color} animatedProps={animatedProps} />
    </Svg>
  )
}
