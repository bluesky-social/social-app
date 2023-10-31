import {Animated} from 'react-native'

export interface Ranges {
  inputRange: number[]
  outputRange: number[]
}

// Parameters for the bounce interpolation
const B_NUM_STEPS = 10 // Minimum 1
const B_STEP_SIZE = 25
const B_END_SLOPE = 0.1

// Bounce equation:
//             k * ln(x/k + 1)
// Domain:     [0, F]             Where F = B_NUM_STEPS * B_STEP_SIZE
// Derivative: k / (k + x)
// Therefore:
//             k / (k + F) = S    Where S = B_END_SLOPE
//         =>  k = SF / (1 - S)
const BOUNCE_K = (B_END_SLOPE * B_NUM_STEPS * B_STEP_SIZE) / (1 - B_END_SLOPE)

// This will create a zone that makes it increasingly harder for user to drag.
// It does not cause the actual bounce
//
// Example:
// const scrollVal = useRef(new Animated.Value(0)).current
// const [transform, setTransform] = useState<TransformType>([])
// useEffect(() => {
//   const top = bounceInterpolation(0, 'top')
//   const bottom = bounceInterpolation(-height, 'bottom')
//   const translateY = scrollVal.interpolate(appendRanges(bottom, top))
//   setTransform([{translateY}])
// }, [scrollVal, height])
//
// <Animated.View style={{transform}}> ... </Animated.View>
export const bounceInterpolation = (
  from: number,
  direction: 'top' | 'bottom',
): Ranges => {
  const dir = direction === 'top' ? 1 : -1
  const result: Ranges = {inputRange: [], outputRange: []}

  for (let i = 0; i <= B_NUM_STEPS; ++i) {
    const x = i * B_STEP_SIZE
    const y = BOUNCE_K * Math.log(x / BOUNCE_K + 1)
    result.inputRange.push(from + dir * x)
    result.outputRange.push(from + dir * y)
  }

  if (dir < 0) {
    result.inputRange.reverse()
    result.outputRange.reverse()
  }

  return result
}

// This will create a zone that makes it impossible for user to drag.
// For usage, see bounceInterpolation.
export const stopInterpolation = (
  from: number,
  direction: 'top' | 'bottom',
): Ranges => {
  if (direction === 'top')
    return {inputRange: [from, from + 1], outputRange: [from, from]}
  else return {inputRange: [from - 1, from], outputRange: [from, from]}
}

// With bounceInterpolation or stopInterpolation append 'bottom' then 'top':
//    appendRanges(bottom, top)
export const appendRanges = (first: Ranges, second: Ranges): Ranges => ({
  inputRange: [...first.inputRange, ...second.inputRange],
  outputRange: [...first.outputRange, ...second.outputRange],
})

const MAX_VELOCITY = 10
const clampVelocity = (velocity: number): number =>
  velocity < -MAX_VELOCITY
    ? -MAX_VELOCITY
    : velocity > MAX_VELOCITY
    ? MAX_VELOCITY
    : velocity

export const springAnimation = (
  value: Animated.Value,
  toValue: number,
  velocityY: number,
) => {
  return Animated.spring(value, {
    toValue: toValue,
    friction: 10,
    tension: 50,
    velocity: 300 * clampVelocity(velocityY),
    useNativeDriver: false,
  })
}

export const decayAnimation = (value: Animated.Value, velocityY: number) => {
  return Animated.decay(value, {
    velocity: clampVelocity(velocityY),
    deceleration: 0.995,
    useNativeDriver: false,
  })
}

export const minScrollValue = (scrollHeight: number, contentHeight: number) =>
  Math.min(0, scrollHeight - contentHeight)
