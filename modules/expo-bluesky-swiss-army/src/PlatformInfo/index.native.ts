import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoPlatformInfo')

export function getIsReducedMotionEnabled() {
  return NativeModule.getIsReducedMotionEnabled()
}
