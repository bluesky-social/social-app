import {useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans} from '@lingui/macro'

import {type LinkMeta} from '#/lib/link-meta/link-meta'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Text} from '#/components/Typography'

export function LinkPreview({
  linkMeta,
  loading,
}: {
  linkMeta?: LinkMeta
  loading: boolean
}) {
  const t = useTheme()
  const [imageLoadError, setImageLoadError] = useState(false)

  if (!linkMeta && !loading) {
    return null
  }

  return (
    <View
      style={[
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        a.flex_row,
        a.rounded_sm,
        a.overflow_hidden,
        a.align_stretch,
      ]}>
      <View
        style={[
          t.atoms.bg_contrast_25,
          {minHeight: 64, width: 114},
          a.justify_center,
          a.align_center,
          a.gap_xs,
        ]}>
        {linkMeta?.image && (
          <Image
            source={linkMeta.image}
            accessibilityIgnoresInvertColors
            transition={200}
            style={[a.absolute, a.inset_0]}
            contentFit="cover"
            onLoad={() => setImageLoadError(false)}
            onError={() => setImageLoadError(true)}
          />
        )}
        {linkMeta && (!linkMeta.image || imageLoadError) && (
          <>
            <ImageIcon style={[t.atoms.text_contrast_low]} />
            <Text style={[t.atoms.text_contrast_low, a.text_xs, a.text_center]}>
              <Trans>No image</Trans>
            </Text>
          </>
        )}
      </View>
      <View style={[a.flex_1, a.justify_center, a.py_sm, a.gap_xs, a.px_md]}>
        {linkMeta ? (
          <>
            <Text
              numberOfLines={2}
              style={[a.leading_snug, a.font_semi_bold, a.text_md]}>
              {linkMeta.title || linkMeta.url}
            </Text>
            <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
              <GlobeIcon size="xs" style={[t.atoms.text_contrast_low]} />
              <Text
                numberOfLines={1}
                style={[
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {toNiceDomain(linkMeta.url)}
              </Text>
            </View>
          </>
        ) : (
          <>
            <LoadingPlaceholder height={16} width={128} />
            <LoadingPlaceholder height={12} width={72} />
          </>
        )}
      </View>
    </View>
  )
}
