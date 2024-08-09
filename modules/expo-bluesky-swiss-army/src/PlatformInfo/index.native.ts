import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoPlatformInfo')

export function getIsReducedMotionEnabled(): boolean {
  return NativeModule.getIsReducedMotionEnabled()
}

export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioMixWithOthers(mixWithOthers)
}
