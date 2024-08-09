import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {AudioCategory} from './types'

const NativeModule = requireNativeModule('ExpoPlatformInfo')

export function getIsReducedMotionEnabled(): boolean {
  return NativeModule.getIsReducedMotionEnabled()
}

export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioMixWithOthers(mixWithOthers)
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioCategory(audioCategory)
}
