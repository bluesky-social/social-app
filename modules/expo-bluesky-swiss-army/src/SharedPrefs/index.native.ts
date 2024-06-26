import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoBlueskySharedPrefs')

export function setValueAsync(
  key: string,
  value: string | number | boolean | null | undefined,
): Promise<void> {
  // A bug on Android causes `JavaScripValue.isString()` to cause a crash on some occasions, seemingly because of a
  // memory violation. Instead, we will use a specific function to set strings on this platform.
  if (Platform.OS === 'android' && typeof value === 'string') {
    return NativeModule.setStringAsync(key, value)
  }
  return NativeModule.setValueAsync(key, value)
}

export function removeValueAsync(key: string): Promise<void> {
  return NativeModule.removeValueAsync(key)
}

export function getStringAsync(key: string): Promise<string | null> {
  return NativeModule.getStringAsync(key)
}

export function getNumberAsync(key: string): Promise<number | null> {
  return NativeModule.getNumberAsync(key)
}

export function getBoolAsync(key: string): Promise<boolean | null> {
  return NativeModule.getBoolAsync(key)
}

export function addToSetAsync(key: string, value: string): Promise<void> {
  return NativeModule.addToSetAsync(key, value)
}

export function removeFromSetAsync(key: string, value: string): Promise<void> {
  return NativeModule.removeFromSetAsync(key, value)
}

export function setContainsAsync(key: string, value: string): Promise<boolean> {
  return NativeModule.setContainsAsync(key, value)
}
