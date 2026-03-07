import {requireNativeViewManager} from 'expo-modules-core'

import {type ExpoScrollEdgeInteractionViewProps} from './ExpoScrollEdgeInteraction.types'

const NativeView: React.ComponentType<ExpoScrollEdgeInteractionViewProps> =
  requireNativeViewManager('ExpoScrollEdgeInteraction')

export function ExpoScrollEdgeInteractionView({
  children,
  ...rest
}: ExpoScrollEdgeInteractionViewProps) {
  return <NativeView {...rest}>{children}</NativeView>
}
