import {withDelay, withSequence, withTiming} from 'react-native-reanimated'

export function ShrinkAndPop() {
  'worklet'

  const animations = {
    opacity: withDelay(200, withTiming(0, {duration: 150})),
    transform: [
      {scale: withSequence(withTiming(0.7), withTiming(1.1, {duration: 150}))},
    ],
  }

  const initialValues = {
    opacity: 1,
    transform: [{scale: 1}],
  }

  return {
    animations,
    initialValues,
  }
}
