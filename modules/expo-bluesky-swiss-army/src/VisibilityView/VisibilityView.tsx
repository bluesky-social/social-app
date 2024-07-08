import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {VisibilityViewProps} from './types'
const NativeView: React.ComponentType<{
  onVisibilityChange: (e: {nativeEvent: {isVisible: boolean}}) => void
  children: React.ReactNode
  enabled: Boolean
}> = requireNativeViewManager('ExpoBlueskyVisibilityView')

export function VisibilityView({
  children,
  onVisibilityChange: onVisibilityChangeOuter,
  enabled,
}: VisibilityViewProps) {
  const onVisibilityChange = React.useCallback(
    (e: {nativeEvent: {isVisible: boolean}}) => {
      onVisibilityChangeOuter(e.nativeEvent.isVisible)
    },
    [onVisibilityChangeOuter],
  )

  return (
    <NativeView onVisibilityChange={onVisibilityChange} enabled={enabled}>
      {children}
    </NativeView>
  )
}
