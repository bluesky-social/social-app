import {interpolate, useAnimatedStyle} from 'react-native-reanimated'
import {useMinimalShellMode as useMinimalShellModeState} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

export function useMinimalShellMode() {
  const mode = useMinimalShellModeState()
  const {footerHeight, headerHeight} = useShellLayout()

  const footerMinimalShellTransform = useAnimatedStyle(() => {
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
  const headerMinimalShellTransform = useAnimatedStyle(() => {
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
  const fabMinimalShellTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(mode.value, [0, 1], [-44, 0]),
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
