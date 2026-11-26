import {requireOptionalNativeModule} from 'expo-modules-core'

import {type InstagramStoryOptions} from './types'

/*
 * Optional so JS shipped over the air to a binary built before this module
 * existed reports Instagram Stories as unavailable instead of crashing.
 */
const NativeModule = requireOptionalNativeModule<{
  isAvailable(): Promise<boolean>
  share(options: InstagramStoryOptions): Promise<void>
}>('ExpoBlueskyInstagramStory')

/** Whether Instagram is installed and this build can share a story to it. */
export async function isAvailable(): Promise<boolean> {
  return (await NativeModule?.isAvailable()) ?? false
}

/**
 * Opens Instagram's story composer with the images filled in. Rejects if
 * Instagram isn't installed or couldn't be opened.
 */
export function share(options: InstagramStoryOptions): Promise<void> {
  if (!NativeModule) {
    return Promise.reject(
      new Error('ExpoBlueskyInstagramStory is not available'),
    )
  }
  return NativeModule.share(options)
}

export type {InstagramStoryOptions}
