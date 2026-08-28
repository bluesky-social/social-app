import {useState} from 'react'
import {Animated} from 'react-native'

export function useAnimatedValue(initialValue: number) {
  /*
   * A lazy `useState` initialiser rather than a lazily-populated ref: both
   * construct once and keep the same instance, but reading a ref during render
   * is a Rules of React violation.
   */
  const [value] = useState(() => new Animated.Value(initialValue))
  return value
}
