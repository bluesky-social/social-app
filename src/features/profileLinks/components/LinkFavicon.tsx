import {useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {type BlobRef, getBlobCidString} from '@atproto/lex'

import {atoms as a} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'

/**
 * The image CDN serves any blob in the owner's repo, so a stored icon loads
 * like an avatar. PNG keeps the transparency most favicons rely on.
 */
export function linkFaviconUrl(did: string, icon: BlobRef) {
  return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${getBlobCidString(icon)}@png`
}

/**
 * A link's stored favicon. Shows `fallback` if the CDN won't serve it, for
 * example after the blob is taken down.
 */
export function LinkFavicon({
  did,
  icon,
  size,
  fallback,
  style,
}: {
  did: string
  icon: BlobRef
  size: number
  fallback: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return (
    <View style={[a.align_center, a.justify_center, style]}>
      <Image
        source={{uri: linkFaviconUrl(did, icon)}}
        style={{width: size, height: size, borderRadius: size / 6}}
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </View>
  )
}

/** Fills the slot a `ButtonIcon` would, so favicon and logo pills line up. */
export function ButtonFavicon({did, icon}: {did: string; icon: BlobRef}) {
  return (
    <LinkFavicon
      did={did}
      icon={icon}
      size={16}
      fallback={<ButtonIcon icon={GlobeIcon} />}
      // ButtonIcon's slot for small buttons
      style={{width: 17, height: 17, marginHorizontal: -2}}
    />
  )
}
