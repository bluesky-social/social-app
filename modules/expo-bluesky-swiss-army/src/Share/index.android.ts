import {requireOptionalNativeModule} from 'expo'

import {type NativeShareResult} from './types'

/*
 * Optional so JS shipped over the air to a binary built before this module
 * existed can fall back to React Native's Share.
 */
const NativeModule = requireOptionalNativeModule<{
  shareText(text: string): Promise<NativeShareResult>
}>('ExpoBlueskyShare')

export const isAvailable = !!NativeModule

/**
 * Opens the system share sheet and resolves once the user picks an app or
 * returns without picking one.
 */
export function shareText(text: string): Promise<NativeShareResult> {
  if (!NativeModule) {
    throw new Error('ExpoBlueskyShare is not available')
  }
  return NativeModule.shareText(text)
}
