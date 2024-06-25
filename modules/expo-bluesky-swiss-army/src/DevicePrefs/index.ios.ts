import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoBlueskyDevicePrefs')

export function getStringValueAsync(
  key: string,
  useAppGroup?: boolean,
): Promise<string | null> {
  return NativeModule.getStringValueAsync(key, useAppGroup)
}

export function setStringValueAsync(
  key: string,
  value: string | null,
  useAppGroup?: boolean,
): Promise<void> {
  return NativeModule.setStringValueAsync(key, value, useAppGroup)
}
