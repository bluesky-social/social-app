import React from 'react'
import {View, ViewStyle} from 'react-native'

/**
 * This utility function captures events and stops
 * them from propagating upwards.
 */
export function EventStopper({
  children,
  style,
}: React.PropsWithChildren<{style?: ViewStyle | ViewStyle[]}>) {
  const stop = (e: any) => {
    e.stopPropagation()
  }
  return (
    <View
      onStartShouldSetResponder={_ => true}
      onTouchEnd={stop}
      // @ts-ignore web only -prf
      onClick={stop}
      onKeyDown={stop}
      style={style}>
      {children}
    </View>
  )
}
