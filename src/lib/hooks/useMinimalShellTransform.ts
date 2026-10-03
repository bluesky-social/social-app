import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellFooterTransform() {
  const {footerMode, footerScrollMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    // Hide the footer when either a screen requests it (footerMode) or the user
    // is scrolling a feed (footerScrollMode), whichever wants it more hidden.
    const footerModeValue = Math.max(footerMode.get(), footerScrollMode.get())
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
  const {footerMode, footerScrollMode} = useMinimalShellMode()

  const fabTransform = useAnimatedStyle(() => {
    const footerModeValue = Math.max(footerMode.get(), footerScrollMode.get())
    return {
      transform: [
        {
          translateY: interpolate(footerModeValue, [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
