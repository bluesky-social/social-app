import React from 'react'
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useMinimalShellMode as useMinimalShellModeState} from '#/state/shell/minimal-mode'

export function useMinimalShellMode() {
  const minimalShellMode = useMinimalShellModeState()
  const minimalShellInterp = useSharedValue(0)
  const footerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: minimalShellInterp.value === 0 ? 'auto' : 'none',
      opacity: interpolate(minimalShellInterp.value, [0, 1], [1, 0]),
      transform: [
        {translateY: interpolate(minimalShellInterp.value, [0, 1], [0, 25])},
      ],
    }
  })
  const headerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: minimalShellInterp.value === 0 ? 'auto' : 'none',
      opacity: interpolate(minimalShellInterp.value, [0, 1], [1, 0]),
      transform: [
        {translateY: interpolate(minimalShellInterp.value, [0, 1], [0, -25])},
      ],
    }
  })
  const fabMinimalShellTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {translateY: interpolate(minimalShellInterp.value, [0, 1], [-44, 0])},
      ],
    }
  })

  React.useEffect(() => {
    if (minimalShellMode) {
      minimalShellInterp.value = withTiming(1, {
        duration: 125,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    } else {
      minimalShellInterp.value = withTiming(0, {
        duration: 125,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    }
  }, [minimalShellInterp, minimalShellMode])

  return {
    footerMinimalShellTransform,
    headerMinimalShellTransform,
    fabMinimalShellTransform,
  }
}
