import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

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
