import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {VisibilityViewProps} from './types'
const NativeView: React.ComponentType<{
  onVisibilityChange: (e: {nativeEvent: {isVisible: boolean}}) => void
  children: React.ReactNode
}> = requireNativeViewManager('ExpoBlueskyVisibilityView')

export function VisibilityView({
  children,
  onVisibilityChange: onVisibilityChangeOuter,
}: VisibilityViewProps) {
  const onVisibilityChange = React.useCallback(
    (e: {nativeEvent: {isVisible: boolean}}) => {
      onVisibilityChangeOuter(e.nativeEvent.isVisible)
    },
    [onVisibilityChangeOuter],
  )

  return (
    <NativeView onVisibilityChange={onVisibilityChange}>{children}</NativeView>
  )
}
