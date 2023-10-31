import * as React from 'react'
import {Animated} from 'react-native'

export function useAnimatedValueXY() {
  const lazyRef = React.useRef<Animated.ValueXY>()

  if (lazyRef.current === undefined) {
    lazyRef.current = new Animated.ValueXY()
  }

  return lazyRef.current as Animated.ValueXY
}
