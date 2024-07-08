import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {VisibilityViewProps} from './types'
const NativeView: React.ComponentType<{
  onActiveChange: (e: {nativeEvent: {isActive: boolean}}) => void
  children: React.ReactNode
  enabled: Boolean
}> = requireNativeViewManager('ExpoBlueskyVisibilityView')

export function VisibilityView({
  children,
  onActiveChange: onActiveChangeOuter,
  enabled,
}: VisibilityViewProps) {
  const onActiveChange = React.useCallback(
    (e: {nativeEvent: {isActive: boolean}}) => {
      onActiveChangeOuter(e.nativeEvent.isActive)
    },
    [onActiveChangeOuter],
  )

  return (
    <NativeView onActiveChange={onActiveChange} enabled={enabled}>
      {children}
    </NativeView>
  )
}
