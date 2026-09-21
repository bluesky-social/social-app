import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

export function useMinimalShellFooterTransform() {
  const {footerMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    const footerModeValue = footerMode.get()
    return {
      pointerEvents: footerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - footerModeValue, 2),
      transform: [
        {
          translateY: interpolate(
            footerModeValue,
            [0, 1],
            [0, footerHeight.get()],
          ),
        },
      ],
    }
  })

  return footerTransform
}
