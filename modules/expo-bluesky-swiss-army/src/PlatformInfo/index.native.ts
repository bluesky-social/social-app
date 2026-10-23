import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {type AudioCategory} from './types'

const NativeModule = requireNativeModule<{
  getIsReducedMotionEnabled(): boolean
  /** Android only */
  reportFullyDrawn(): void
  /** iOS only */
  setAudioActive(active: boolean): void
  /** iOS only */
  setAudioCategory(audioCategory: AudioCategory): void
}>('ExpoPlatformInfo')

export function getIsReducedMotionEnabled(): boolean {
  return NativeModule.getIsReducedMotionEnabled()
}

let fullyDrawnReported = false

export function reportFullyDrawn(): void {
  if (Platform.OS !== 'android' || fullyDrawnReported) return
  fullyDrawnReported = true
  NativeModule.reportFullyDrawn()
}

export function setAudioActive(active: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioActive(active)
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioCategory(audioCategory)
}
