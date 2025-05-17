import {View, type ViewStyle} from 'react-native'
import type React from 'react'

/**
 * This utility function captures events and stops
 * them from propagating upwards.
 */
export function EventStopper({
  children,
  style,
  onKeyDown = true,
}: React.PropsWithChildren<{
  style?: ViewStyle | ViewStyle[]
  /**
   * Default `true`. Set to `false` to allow onKeyDown to propagate
   */
  onKeyDown?: boolean
}>) {
  const stop = (e: any) => {
    e.stopPropagation()
  }
  return (
    <View
      onStartShouldSetResponder={_ => true}
      onTouchEnd={stop}
      // @ts-ignore web only -prf
      onClick={stop}
      onKeyDown={onKeyDown ? stop : undefined}
      style={style}>
      {children}
    </View>
  )
}
