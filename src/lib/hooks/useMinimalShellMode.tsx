import React from 'react'
import {useStores} from 'state/index'
import {Animated} from 'react-native'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

export function useMinimalShellMode() {
  const store = useStores()
  const minimalShellInterp = useAnimatedValue(0)
  const footerMinimalShellTransform = {
    transform: [{translateY: Animated.multiply(minimalShellInterp, 100)}],
  }

  React.useEffect(() => {
    if (store.shell.minimalShellMode) {
      Animated.timing(minimalShellInterp, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    } else {
      Animated.timing(minimalShellInterp, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }
  }, [minimalShellInterp, store.shell.minimalShellMode])

  return {footerMinimalShellTransform}
}
