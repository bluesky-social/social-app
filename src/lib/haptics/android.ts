import {type AndroidHaptics} from 'expo-haptics'

import {ANDROID_API_LEVEL} from '#/env'

/**
 * A `View.performHapticFeedback` constant, as exposed by expo-haptics.
 */
export type AndroidHaptic = `${AndroidHaptics}`

/*
 * Constants added after our minSdk (24), with the API level they were added in
 * and an older constant that plays the same effect in AOSP's
 * HapticFeedbackVibrationProvider. OEMs can customise individual constants, so
 * "same effect" only strictly holds on Pixel-like devices. Constants not listed
 * here exist on every API level we support.
 */
const COMPAT: Partial<
  Record<AndroidHaptic, {minApi: number; fallback: AndroidHaptic | null}>
> = {
  // EFFECT_TICK
  'segment-tick': {minApi: 34, fallback: 'context-click'},
  'toggle-on': {minApi: 34, fallback: 'context-click'},
  'gesture-end': {minApi: 30, fallback: 'context-click'},
  'virtual-key-release': {minApi: 27, fallback: 'context-click'},
  // EFFECT_TEXTURE_TICK
  'segment-frequent-tick': {minApi: 34, fallback: 'clock-tick'},
  'toggle-off': {minApi: 34, fallback: 'clock-tick'},
  'text-handle-move': {minApi: 27, fallback: 'clock-tick'},
  // EFFECT_CLICK
  confirm: {minApi: 30, fallback: 'virtual-key'},
  'gesture-start': {minApi: 30, fallback: 'virtual-key'},
  // EFFECT_HEAVY_CLICK
  'drag-start': {minApi: 34, fallback: 'long-press'},
  // EFFECT_DOUBLE_CLICK has no older equivalent, so settle for a heavy click
  reject: {minApi: 30, fallback: 'long-press'},
  // KEYBOARD_PRESS has the same value as KEYBOARD_TAP
  'keyboard-press': {minApi: 27, fallback: 'keyboard-tap'},
  'keyboard-release': {minApi: 27, fallback: null},
  'no-haptics': {minApi: 34, fallback: null},
}

/**
 * Returns the constant to actually play on this device, falling back to an
 * older equivalent when `haptic` isn't available at this API level. expo-haptics
 * rejects constants the device doesn't have, so always go through this.
 */
export function resolveAndroidHaptic(
  haptic: AndroidHaptic,
  apiLevel: number = ANDROID_API_LEVEL,
): AndroidHaptic | null {
  const compat = COMPAT[haptic]
  if (!compat || apiLevel >= compat.minApi) return haptic
  return compat.fallback
    ? resolveAndroidHaptic(compat.fallback, apiLevel)
    : null
}
