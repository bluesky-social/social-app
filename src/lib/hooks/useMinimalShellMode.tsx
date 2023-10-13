import React from 'react'
import {autorun} from 'mobx'
import {useStores} from 'state/index'
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export function useMinimalShellMode() {
  const store = useStores()
  const minimalShellInterp = useSharedValue(0)
  const footerMinimalShellTransform = useAnimatedStyle(() => {
    return {
      opacity: interpolate(minimalShellInterp.value, [0, 1], [1, 0]),
      transform: [
        {translateY: interpolate(minimalShellInterp.value, [0, 1], [0, 25])},
      ],
    }
  })
  const headerMinimalShellTransform = useAnimatedStyle(() => {
    return {
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
    return autorun(() => {
      if (store.shell.minimalShellMode) {
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
    })
  }, [minimalShellInterp, store.shell.minimalShellMode])

  return {
    footerMinimalShellTransform,
    headerMinimalShellTransform,
    fabMinimalShellTransform,
  }
}
