import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
  const mode = useMinimalShellMode()
  const {headerHeight} = useShellLayout()

  const headerTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - mode.value, 2),
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [0, -headerHeight.value]),
        },
      ],
    }
  })

  return headerTransform
}

export function useMinimalShellFooterTransform() {
  const mode = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: mode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - mode.value, 2),
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [0, footerHeight.value]),
        },
      ],
    }
  })
  return footerTransform
}

export function useMinimalShellFabTransform() {
  const mode = useMinimalShellMode()

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
