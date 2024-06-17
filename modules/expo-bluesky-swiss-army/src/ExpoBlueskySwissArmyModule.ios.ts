import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoBlueskySwissArmy')

export const ExpoBlueskySwissArmyModule = {
  getStringValueAsync(key: string, useAppGroup = false): Promise<string> {
    return NativeModule.getStringValueAsync(key, useAppGroup)
  },
  setStringValueAsync(
    key: string,
    value: string | null,
    useAppGroup = false,
  ): Promise<void> {
    return NativeModule.setStringValueAsync(key, value, useAppGroup)
  },
}
