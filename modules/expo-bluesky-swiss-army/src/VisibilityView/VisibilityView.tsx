import React from 'react'
import {View} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {VisibilityViewProps} from './types'
const NativeView: React.ComponentType<{
  onChangeStatus: (e: {nativeEvent: {isActive: boolean}}) => void
  children: React.ReactNode
  enabled: Boolean
}> = requireNativeViewManager('ExpoBlueskyVisibilityView')

const NativeModule = requireNativeModule('ExpoBlueskyVisibilityView')

export async function updateActiveViewAsync() {
  await NativeModule.updateActiveViewAsync()
}

export function VisibilityView({
  children,
  onChangeStatus: onChangeStatusOuter,
  enabled,
}: VisibilityViewProps) {
  const [isActive, setIsActive] = React.useState(false)

  const onChangeStatus = React.useCallback(
    (e: {nativeEvent: {isActive: boolean}}) => {
      setIsActive(e.nativeEvent.isActive)
      onChangeStatusOuter(e.nativeEvent.isActive)
    },
    [onChangeStatusOuter],
  )

  // @TODO remove test wrapper
  return (
    <View>
      <View
        style={
          isActive
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'red',
                opacity: 0.5,
              }
            : undefined
        }
      />
      <NativeView onChangeStatus={onChangeStatus} enabled={enabled}>
        {children}
      </NativeView>
    </View>
  )
}
