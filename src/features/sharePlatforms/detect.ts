import {Linking} from 'react-native'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'

import {IS_ANDROID, IS_IOS} from '#/env'
import {SHARE_PLATFORMS, type SharePlatformId} from './catalog'

/**
 * The catalog platforms installed on this device, in catalog order. Empty on
 * web. Checked on demand and never stored, since the list of installed apps is
 * sensitive and changes as people install and remove apps.
 */
export async function getInstalledSharePlatforms(): Promise<SharePlatformId[]> {
  if (IS_IOS) {
    const installed = await Promise.all(
      SHARE_PLATFORMS.map(p => isSchemeHandled(p.ios?.scheme)),
    )
    return SHARE_PLATFORMS.filter((_, i) => installed[i]).map(p => p.id)
  }

  if (IS_ANDROID) {
    const packages = SHARE_PLATFORMS.flatMap(p => p.android?.packages ?? [])
    // null on binaries without the native check, so package-based apps hide
    const installedPackages = new Set(Share.getInstalledPackages(packages))
    const installed = await Promise.all(
      SHARE_PLATFORMS.map(p =>
        p.android?.packages
          ? Promise.resolve(
              p.android.packages.some(pkg => installedPackages.has(pkg)),
            )
          : isSchemeHandled(p.android?.scheme),
      ),
    )
    return SHARE_PLATFORMS.filter((_, i) => installed[i]).map(p => p.id)
  }

  return []
}

async function isSchemeHandled(scheme: string | undefined): Promise<boolean> {
  if (!scheme) return false
  try {
    return await Linking.canOpenURL(`${scheme}://`)
  } catch {
    return false
  }
}
