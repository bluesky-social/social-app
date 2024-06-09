import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'

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
