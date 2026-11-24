import {Linking} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'

import {IS_ANDROID, IS_IOS} from '#/env'
import {
  getSharePlatform,
  type ShareContent,
  type SharePlatformId,
} from './catalog'
import {type OpenSharePlatformStep} from './types'

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

/** Why opening a platform's app failed, and at which step. */
export class OpenSharePlatformError extends Error {
  step: OpenSharePlatformStep

  constructor(step: OpenSharePlatformStep, message: string) {
    super(message)
    this.name = 'OpenSharePlatformError'
    this.step = step
  }
}

/**
 * Swaps the link in an OS error message for just its scheme. The link may
 * carry a title (e.g. for email), and the message is logged. It's matched as
 * passed and decoded too, since the OS doesn't always repeat it as given:
 * Android describes a failed intent with its link decoded, for schemes it
 * doesn't mask.
 */
export function redactLink(message: string, url: string): string {
  const forms = [url]
  try {
    forms.push(decodeURIComponent(url))
  } catch {
    // Not valid percent-encoding, so it can only appear as passed
  }
  const redacted = `${url.split(':')[0]}:<link>`
  return forms.reduce((text, form) => text.replaceAll(form, redacted), message)
}

/**
 * Runs one step of opening an app, so a failure says which step it was. Any
 * link in the error is redacted before it's logged (see `redactLink`).
 */
async function step<T>(
  name: OpenSharePlatformStep,
  run: () => Promise<T>,
  url?: string,
): Promise<T> {
  try {
    return await run()
  } catch (e) {
    let message = e instanceof Error ? e.message : String(e)
    if (url) message = redactLink(message, url)
    throw new OpenSharePlatformError(name, message)
  }
}

/**
 * Opens a platform's app with the post ready to send. Rejects with an
 * `OpenSharePlatformError` when the app can't be opened, e.g. it was
 * uninstalled after the row was shown.
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
      if (!(await step('checkInstalled', () => Linking.canOpenURL(appUrl)))) {
        throw new OpenSharePlatformError(
          'notInstalled',
          `${id} is not installed`,
        )
      }
      await step('clipboard', () => Clipboard.setUrlAsync(content.url))
      await step('openUrl', () => Linking.openURL(appUrl), appUrl)
      return {copiedLink: true}
    }
    const shareUrl = ios.getShareUrl(content)
    await step('openUrl', () => Linking.openURL(shareUrl), shareUrl)
    return {copiedLink: false}
  }

  if (IS_ANDROID && platform.android) {
    const android = platform.android
    if (android.directShare) {
      const [pkg] =
        (await step('checkInstalled', () =>
          Share.getInstalledPackages(android.packages),
        )) ?? []
      if (!pkg) {
        throw new OpenSharePlatformError(
          'notInstalled',
          `${id} is not installed`,
        )
      }
      await step('shareToPackage', () =>
        Share.shareTextToPackage(content.url, pkg),
      )
      return {copiedLink: false}
    }
    const shareUrl = android.getShareUrl(content)
    await step('openUrl', () => Linking.openURL(shareUrl), shareUrl)
    return {copiedLink: false}
  }

  throw new OpenSharePlatformError(
    'unsupported',
    `${id} is not supported on this platform`,
  )
}
