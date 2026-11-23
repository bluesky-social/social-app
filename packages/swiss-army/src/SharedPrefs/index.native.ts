import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule<{
  setString(key: string, value: string): void
  setNumber(key: string, value: number): void
  setBool(key: string, value: boolean): void
  removeValue(key: string): void
  getString(key: string): string | null | undefined
  getNumber(key: string): number | null | undefined
  getBool(key: string): boolean | null | undefined
  addToSet(key: string, value: string): void
  removeFromSet(key: string, value: string): void
  setContains(key: string, value: string): boolean
}>('ExpoBlueskySharedPrefs')

export function setValue(
  key: string,
  value: string | number | boolean | null | undefined,
): void {
  /*
   * Each type has its own native setter: `JavaScriptValue` can't be a
   * function argument since Expo SDK 58.
   */
  switch (typeof value) {
    case 'string':
      return NativeModule.setString(key, value)
    case 'number':
      return NativeModule.setNumber(key, value)
    case 'boolean':
      return NativeModule.setBool(key, value)
    default:
      return NativeModule.removeValue(key)
  }
}

export function removeValue(key: string): void {
  return NativeModule.removeValue(key)
}

export function getString(key: string): string | undefined {
  return nullToUndefined(NativeModule.getString(key))
}

export function getNumber(key: string): number | undefined {
  return nullToUndefined(NativeModule.getNumber(key))
}

export function getBool(key: string): boolean | undefined {
  return nullToUndefined(NativeModule.getBool(key))
}

export function addToSet(key: string, value: string): void {
  return NativeModule.addToSet(key, value)
}

export function removeFromSet(key: string, value: string): void {
  return NativeModule.removeFromSet(key, value)
}

export function setContains(key: string, value: string): boolean {
  return NativeModule.setContains(key, value)
}

// iOS returns `null` if a value does not exist, and Android returns `undefined. Normalize these here for JS types
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  if (value == null) {
    return undefined
  }
  return value
}
