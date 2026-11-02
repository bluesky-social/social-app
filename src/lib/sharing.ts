import {Share} from 'react-native'
// import * as Sharing from 'expo-sharing'
import {setStringAsync} from 'expo-clipboard'
import {Share as BlueskyShare} from '@bsky.app/expo-bluesky-swiss-army'
import {t} from '@lingui/core/macro'

import * as Toast from '#/components/Toast'
import {IS_ANDROID, IS_IOS} from '#/env'

export type ShareResult = {
  status: 'shared' | 'dismissed'
  /**
   * The app the user picked: the `activityType` on iOS (e.g.
   * `com.apple.UIKit.activity.Message`), the package name on Android (e.g.
   * `com.whatsapp`).
   */
  target?: string
}

/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 * @returns What the user did with the share sheet, or `undefined` when the
 * platform can't tell us (web, or an Android build without the native module).
 */
export async function shareUrl(url: string): Promise<ShareResult | undefined> {
  if (IS_ANDROID) {
    if (BlueskyShare.isAvailable) {
      const result = await BlueskyShare.shareText(url)
      return toShareResult(result.action, result.target)
    }
    await Share.share({message: url})
  } else if (IS_IOS) {
    const result = await Share.share({url})
    return toShareResult(result.action, result.activityType)
  } else {
    // React Native Share is not supported by web. Web Share API
    // has increasing but not full support, so default to clipboard
    setStringAsync(url)
    Toast.show(t`Copied to clipboard`, {
      type: 'success',
    })
  }
}

function toShareResult(
  action: string,
  target: string | null | undefined,
): ShareResult {
  if (action === Share.sharedAction) {
    return {status: 'shared', target: target ?? undefined}
  }
  return {status: 'dismissed'}
}

/**
 * This function shares a text using the native Share API if available, or
 * copies it to the clipboard and displays a toast message if not (mostly on
 * web).
 *
 * If you want the "full" sharing experience, use the other `shareUrl`
 * function, which returns a result of the share action for metrics.
 *
 * @param {string} text - A string representing the text that needs to be
 * shared or copied to the clipboard.
 */
export async function simpleShareText(text: string) {
  if (IS_ANDROID || IS_IOS) {
    await Share.share({message: text})
  } else {
    await setStringAsync(text)
    Toast.show(t`Copied to clipboard`, {
      type: 'success',
    })
  }
}
