import React from 'react'
import {View} from 'react-native'

/**
 * This utility function captures events and stops
 * them from propagating upwards.
 */
export function EventStopper({children}: React.PropsWithChildren<{}>) {
  const stop = (e: any) => {
    e.stopPropagation()
  }
  return (
    <View
      onStartShouldSetResponder={_ => true}
      onTouchEnd={stop}
      // @ts-ignore web only -prf
      onClick={stop}
      onKeyDown={stop}>
      {children}
    </View>
  )
}
