import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useHasNativeTabs} from '#/features/verticalBar'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

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

export function useMinimalShellFabTransform() {
  const {footerMode} = useMinimalShellMode()
  // Native tabs are cleared using the bottom safe area inset instead
  const hasNativeTabs = useHasNativeTabs()

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: hasNativeTabs
            ? 0
            : interpolate(footerMode.get(), [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
