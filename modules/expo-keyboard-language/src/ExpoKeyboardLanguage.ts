import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoKeyboardLanguage')

/**
 * Gets the keyboard language (BCP 47 tag) for the text input identified
 * by the given node handle. Returns `null` when unavailable.
 */
export function getKeyboardLanguage(nodeHandle: number): string | null {
  return NativeModule.getKeyboardLanguage(nodeHandle)
}
