import {useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {getBlobCidString} from '@atproto/lex'

import {atoms as a} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {type ProfileLink} from '../types'

/**
 * Where a link's favicon loads from. Profile views give the URL; links read
 * from the owner's repo only have the blob, which the image CDN serves like an
 * avatar. PNG keeps the transparency most favicons rely on.
 */
export function linkFaviconUrl(
  link: ProfileLink,
  did: string | undefined,
): string | undefined {
  if (link.iconUrl) return link.iconUrl
  if (!link.icon || !did) return undefined
  return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${getBlobCidString(link.icon)}@png`
}

/**
 * A link's stored favicon. Shows `fallback` if the CDN won't serve it, for
 * example after the blob is taken down.
 */
export function LinkFavicon({
  uri,
  size,
  fallback,
  style,
}: {
  uri: string
  size: number
  fallback: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return (
    <View style={[a.align_center, a.justify_center, style]}>
      <Image
        source={{uri}}
        style={{width: size, height: size, borderRadius: size / 6}}
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </View>
  )
}

/** Fills the slot a `ButtonIcon` would, so favicon and logo pills line up. */
export function ButtonFavicon({uri}: {uri: string}) {
  return (
    <LinkFavicon
      uri={uri}
      size={16}
      fallback={<ButtonIcon icon={GlobeIcon} />}
      // ButtonIcon's slot for small buttons
      style={{width: 17, height: 17, marginHorizontal: -2}}
    />
  )
}
