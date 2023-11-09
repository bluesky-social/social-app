import {
  AnimatableValue,
  interpolate,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'

import {useMinimalShellMode as useMinimalShellModeState} from '#/state/shell/minimal-mode'

function withShellTiming<T extends AnimatableValue>(value: T): T {
  'worklet'
  return withTiming(value, {
    duration: 125,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  })
}

export function useMinimalShellMode() {
  const mode = useMinimalShellModeState()
  const footerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value ? 'none' : 'auto',
      opacity: withShellTiming(interpolate(mode.value ? 1 : 0, [0, 1], [1, 0])),
      transform: [
        {
          translateY: withShellTiming(
            interpolate(mode.value ? 1 : 0, [0, 1], [0, 25]),
          ),
        },
      ],
    }
  })
  const headerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value ? 'none' : 'auto',
      opacity: withShellTiming(interpolate(mode.value ? 1 : 0, [0, 1], [1, 0])),
      transform: [
        {
          translateY: withShellTiming(
            interpolate(mode.value ? 1 : 0, [0, 1], [0, -25]),
          ),
        },
      ],
    }
  })
  const fabMinimalShellTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withShellTiming(
            interpolate(mode.value ? 1 : 0, [0, 1], [-44, 0]),
          ),
        },
      ],
    }
  })
  return {
    footerMinimalShellTransform,
    headerMinimalShellTransform,
    fabMinimalShellTransform,
  }
}
