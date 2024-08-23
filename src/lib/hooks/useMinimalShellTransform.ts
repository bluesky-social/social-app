import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
  const {headerMode} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()

  const headerTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: headerMode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerMode.value, 2),
      transform: [
        {
          translateY: interpolate(
            headerMode.value,
            [0, 1],
            [0, -headerHeight.value],
          ),
        },
      ],
    }
  })

  return headerTransform
}

export function useMinimalShellFooterTransform() {
  const {footerMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    return {
      pointerEvents: footerMode.value === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - footerMode.value, 2),
      transform: [
        {
          translateY: interpolate(
            footerMode.value,
            [0, 1],
            [0, footerHeight.value],
          ),
        },
      ],
    }
  })

  return footerTransform
}

export function useMinimalShellFabTransform() {
  const {footerMode} = useMinimalShellMode()

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(footerMode.value, [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
