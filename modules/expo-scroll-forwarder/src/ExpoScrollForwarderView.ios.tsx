import {ComponentType} from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {ExpoScrollForwarderViewProps} from './ExpoScrollForwarder.types'

const NativeView: ComponentType<ExpoScrollForwarderViewProps> =
  requireNativeViewManager('ExpoScrollForwarder')

export function ExpoScrollForwarderView({
  children,
  ...rest
}: ExpoScrollForwarderViewProps) {
  return <NativeView {...rest}>{children}</NativeView>
}
