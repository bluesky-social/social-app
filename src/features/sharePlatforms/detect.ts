import {Linking} from 'react-native'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'

import {IS_ANDROID, IS_IOS} from '#/env'
import {
  SHARE_PLATFORMS,
  type SharePlatform,
  type SharePlatformId,
} from './catalog'

/**
 * The catalog platforms installed on this device, in catalog order. Empty on
 * web. Checked on demand and never stored, since the list of installed apps is
 * sensitive and changes as people install and remove apps.
 */
export async function getInstalledSharePlatforms(): Promise<SharePlatformId[]> {
  if (!IS_IOS && !IS_ANDROID) return []
  // null on binaries without the native check, so package-based apps hide
  const installedPackages = new Set(
    IS_ANDROID
      ? await Share.getInstalledPackages(
          SHARE_PLATFORMS.flatMap(p => p.android?.packages ?? []),
        )
      : null,
  )
  const installed = await Promise.all(
    SHARE_PLATFORMS.map(p => isInstalled(p, installedPackages)),
  )
  return SHARE_PLATFORMS.filter((_, i) => installed[i]).map(p => p.id)
}

async function isInstalled(
  platform: SharePlatform,
  installedPackages: Set<string>,
): Promise<boolean> {
  if (IS_IOS) return await isSchemeHandled(platform.ios?.scheme)
  if (platform.android?.packages) {
    return platform.android.packages.some(pkg => installedPackages.has(pkg))
  }
  return await isSchemeHandled(platform.android?.scheme)
}

async function isSchemeHandled(scheme: string | undefined): Promise<boolean> {
  if (!scheme) return false
  try {
    return await Linking.canOpenURL(`${scheme}://`)
  } catch {
    return false
  }
}
