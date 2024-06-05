import {useRef} from 'react'
import {Animated} from 'react-native'

export function useAnimatedValue(initialValue: number) {
  const lazyRef = useRef<Animated.Value>()

  if (lazyRef.current === undefined) {
    lazyRef.current = new Animated.Value(initialValue)
  }

  return lazyRef.current as Animated.Value
}
