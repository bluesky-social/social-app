// import React from 'react'
// import {useStores} from 'state/index'
// import {
//   interpolate,
//   useAnimatedStyle,
//   useSharedValue,
//   withTiming,
// } from 'react-native-reanimated'

// export function useMinimalShellMode() {
//   const store = useStores()
//   const minimalShellInterp = useSharedValue(0)
//   const footerMinimalShellTransform = useAnimatedStyle(() => {
//     return {
//       transform: [
//         {translateY: interpolate(minimalShellInterp.value, [0, 1], [0, 100])},
//       ],
//     }
//   })
//   const headerMinimalShellTransform = useAnimatedStyle(() => {
//     return {
//       transform: [
//         {translateY: interpolate(minimalShellInterp.value, [0, 1], [0, -100])},
//       ],
//     }
//   })

//   React.useEffect(() => {
//     if (store.shell.minimalShellMode) {
//       minimalShellInterp.value = withTiming(1, {
//         duration: 100,
//       })
//     } else {
//       minimalShellInterp.value = withTiming(0, {
//         duration: 100,
//       })
//     }
//   }, [minimalShellInterp, store.shell.minimalShellMode])

//   return {footerMinimalShellTransform, headerMinimalShellTransform}
// }

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
  const headerMinimalShellTransform = {
    transform: [{translateY: Animated.multiply(minimalShellInterp, -100)}],
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

  return {footerMinimalShellTransform, headerMinimalShellTransform}
}
