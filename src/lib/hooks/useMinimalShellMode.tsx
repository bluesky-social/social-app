import {
  AnimatableValue,
  interpolate,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'

import {useMinimalShellMode as useMinimalShellModeState} from '#/state/shell/minimal-mode'

export function useMinimalShellMode() {
  const mode = useMinimalShellModeState()
  const footerHeight = 80 // TODO
  const footerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - mode.value, 2),
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [0, footerHeight]),
        },
      ],
    }
  })
  const headerHeight = 80 // TODO
  const headerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - mode.value, 2),
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [0, -headerHeight]),
        },
      ],
    }
  })
  const fabMinimalShellTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          // TODO
          translateY: 0,
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
