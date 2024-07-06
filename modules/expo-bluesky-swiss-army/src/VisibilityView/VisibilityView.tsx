import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {VisibilityViewProps} from './types'
const NativeView: React.ComponentType<VisibilityViewProps> =
  requireNativeViewManager('ExpoBlueskyVisibilityView')

export function VisibilityView({
  children,
  onVisibilityChange: onVisibilityChangeOuter,
}: VisibilityViewProps) {
  const onVisibilityChangeOuter = React.useCallback(
    (e: {nativeEvent: {visible: boolean}}) => {
      onVisibilityChangeOuter(e.nativeEvent.visible)
    },
    [onVisibilityChangeOuter],
  )

  return (
    <NativeView onVisibilityChange={onVisibilityChange}>{children}</NativeView>
  )
}
