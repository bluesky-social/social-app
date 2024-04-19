import {useLayoutEffect, useRef} from 'react'
import {LayoutAnimation} from 'react-native'

import {isAndroid, isIOS} from '#/platform/detection'

// triggers a layout animation when the deps change
// disabled on the first render
export function useLayoutAnimation(
  {
    animation = LayoutAnimation.Presets.easeInEaseOut,
    iOS = true,
    android = true,
  },
  deps: any[],
) {
  const firstRef = useRef(true)
  useLayoutEffect(() => {
    if (firstRef.current) {
      firstRef.current = false
      return
    }
    if ((isAndroid && android) || (isIOS && iOS)) {
      LayoutAnimation.configureNext(animation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [android, iOS, animation, ...deps])
}
