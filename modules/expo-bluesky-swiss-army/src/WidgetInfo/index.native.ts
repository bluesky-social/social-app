import {requireNativeModule} from 'expo-modules-core'

type NativeWidgetInfoModule = {
  isInstalled(kind: string): Promise<boolean>
}

const NativeModule = requireNativeModule<NativeWidgetInfoModule>(
  'ExpoBlueskyWidgetInfo',
)

export function isInstalled(kind: string): Promise<boolean> {
  return NativeModule.isInstalled(kind)
}
