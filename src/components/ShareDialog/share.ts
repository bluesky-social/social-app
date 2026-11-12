import {Linking} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'

import {IS_ANDROID, IS_IOS} from '#/env'
import {
  getSharePlatform,
  type ShareContent,
  type SharePlatformId,
} from './catalog'

export type OpenSharePlatformResult = {
  /**
   * The link was copied rather than filled in, so the person needs to paste
   * it. The share row should say so.
   */
  copiedLink: boolean
}

/**
 * Whether the platform gets the link on the clipboard for the person to
 * paste, rather than filled in (`copyAndOpen` on iOS).
 */
export function needsPaste(id: SharePlatformId): boolean {
  return IS_IOS && !!getSharePlatform(id).ios?.copyAndOpen
}

/**
 * Whether the platform falls back to having the link pasted when its share
 * link won't open (`pasteFallback` on iOS). Retry with `{paste: true}`.
 */
export function hasPasteFallback(id: SharePlatformId): boolean {
  return IS_IOS && !!getSharePlatform(id).ios?.pasteFallback
}

/**
 * Opens a platform's app with the post ready to send. Rejects when the app
 * can't be opened, e.g. it was uninstalled after the row was shown.
 */
export async function openSharePlatform(
  id: SharePlatformId,
  content: ShareContent,
  {
    paste = false,
  }: {
    /** On iOS, copy the link and open the app, even if it has a share link. */
    paste?: boolean
  } = {},
): Promise<OpenSharePlatformResult> {
  const platform = getSharePlatform(id)

  if (IS_IOS && platform.ios) {
    const ios = platform.ios
    if (ios.copyAndOpen || paste) {
      const appUrl = `${ios.scheme}://`
      // Check first, so a failed open doesn't overwrite the clipboard
      if (!(await Linking.canOpenURL(appUrl))) {
        throw new Error(`${id} is not installed`)
      }
      await Clipboard.setUrlAsync(content.url)
      await Linking.openURL(appUrl)
      return {copiedLink: true}
    }
    await Linking.openURL(ios.getShareUrl(content))
    return {copiedLink: false}
  }

  if (IS_ANDROID && platform.android) {
    const android = platform.android
    if (android.directShare) {
      const [pkg] = (await Share.getInstalledPackages(android.packages)) ?? []
      if (!pkg) throw new Error(`${id} is not installed`)
      await Share.shareTextToPackage(content.url, pkg)
      return {copiedLink: false}
    }
    await Linking.openURL(android.getShareUrl(content))
    return {copiedLink: false}
  }

  throw new Error(`${id} is not supported on this platform`)
}
