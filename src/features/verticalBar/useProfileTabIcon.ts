import {PixelRatio} from 'react-native'
import {ClippedImage} from '@bsky.app/expo-bluesky-swiss-army'
import {type NativeBottomTabIcon} from '@react-navigation/bottom-tabs/unstable'
import {useQuery} from '@tanstack/react-query'

import {convertCdnPreset} from '#/lib/media/util'
import {STALE} from '#/state/queries'
import {useProfileQuery} from '#/state/queries/profile'
import {createQueryKey} from '#/state/queries/util'
import {useSession} from '#/state/session'

/**
 * Size of the avatar in the native tab bar, in points. The native tab bar draws
 * its glyphs at about 20pt, and this keeps the avatar about as much bigger than
 * them as it is in the JS tab bar.
 */
const TAB_ICON_SIZE = 23

const profileTabIconQueryKeyRoot = 'profileTabIcon'

/**
 * The current account's avatar as a native tab bar icon - a circle, or a
 * rounded square for labelers, like `UserAvatar`. Native tab bar items can't
 * clip images, so the avatar is clipped natively and cached as a PNG.
 *
 * Returns `undefined` while loading, if the account has no avatar, or if
 * clipping fails, so callers can fall back to a glyph.
 */
export function useProfileTabIcon(): NativeBottomTabIcon | undefined {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const avatar = profile?.avatar
  const isLabeler = !!profile?.associated?.labeler
  const scale = PixelRatio.get()

  const {data: uri} = useQuery({
    queryKey: createQueryKey(profileTabIconQueryKeyRoot, {
      avatar,
      isLabeler,
      scale,
    }),
    queryFn: () =>
      ClippedImage.clipImageAsync({
        url: convertCdnPreset(avatar!, 'avatar_thumbnail'),
        size: TAB_ICON_SIZE,
        // Same corner radius as `UserAvatar` at this size
        cornerRadius: isLabeler ? 3 : TAB_ICON_SIZE / 2,
        scale,
      }),
    enabled: !!avatar,
    staleTime: STALE.INFINITY,
    retry: 1,
    // Keep showing the old avatar while a new one is clipped
    placeholderData: previous => previous,
  })

  if (!avatar || !uri) return undefined

  return {
    type: 'image',
    source: {uri, width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, scale},
    // Keep the avatar's colours rather than tinting it like a glyph
    tinted: false,
  }
}
