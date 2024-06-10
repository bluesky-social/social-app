import {withTiming} from 'react-native-reanimated'

export function ScaleAndFadeIn() {
  'worklet'

  const animations = {
    opacity: withTiming(1),
    transform: [{scale: withTiming(1)}],
  }

  const initialValues = {
    opacity: 0,
    transform: [{scale: 0.7}],
  }

  return {
    animations,
    initialValues,
  }
}

export function ScaleAndFadeOut() {
  'worklet'

  const animations = {
    opacity: withTiming(0),
    transform: [{scale: withTiming(0.7)}],
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
