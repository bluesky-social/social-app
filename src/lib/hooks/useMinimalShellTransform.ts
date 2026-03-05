import {interpolate, useAnimatedStyle} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {IS_LIQUID_GLASS} from '#/env'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
  const {headerMode} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()
  const {top: topInset} = useSafeAreaInsets()

  const headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.get()
    const hHeight = headerHeight.get()

    if (IS_LIQUID_GLASS) {
      // bit of a hackfix, but: the header can get affected by scrollEdgeEffects
      // when animating from closed to open. workaround is to trigger a relayout
      // by offsetting the top position. the actual value doesn't matter, and we
      // simultaneously offset it using the translate transform.
      // I think a cleaner way to do it would be to use UIScrollEdgeElementContainerInteraction
      // manually or something like that, because this kinda sucks -sfn
      const relayoutingOffset = headerModeValue === 0 ? 1 : 0
      return {
        top: relayoutingOffset,
        pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
        opacity: Math.pow(1 - headerModeValue, 2),
        transform: [
          {
            translateY:
              interpolate(
                headerModeValue,
                [0, 1],
                [0, headerPinnedHeight - hHeight],
              ) - relayoutingOffset,
          },
        ],
      }
    }

    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(headerModeValue, [0, 1], [0, -hHeight]),
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

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(footerMode.get(), [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
