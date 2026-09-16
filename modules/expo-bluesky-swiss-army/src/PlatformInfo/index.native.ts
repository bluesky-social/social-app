import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {type AudioCategory} from './types'

const NativeModule = requireNativeModule('ExpoPlatformInfo')

/**
 * Whether the user has enabled reduced motion at the OS level.
 *
 * This is called at module scope during boot via src/state/persisted/schema.ts,
 * so a rejected native call would crash the app on startup. We catch any native
 * failure and fall back to false to keep boot safe. See Sentry issue APP-T2EW,
 * where a malformed TRANSITION_ANIMATION_SCALE setting threw at startup.
 */
export function getIsReducedMotionEnabled(): boolean {
  try {
    return NativeModule.getIsReducedMotionEnabled()
  } catch {
    return false
  }
}

export function setAudioActive(active: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioActive(active)
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioCategory(audioCategory)
}
