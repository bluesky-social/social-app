import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

const THUMBNAIL_SIZE = 64

/**
 * A compact document link used by grouped Activity recommendations and actor
 * document groups.
 *
 * The caller constructs the external view so this component stays independent
 * of Activity's record and sidecar traversal.
 */
export function StandardSiteCompactDocumentCard({
  view,
}: {
  view?: app.bsky.embed.external.ViewExternal
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const cardView = view?.uri && view.title?.trim() ? view : undefined
  const title = cardView?.title?.trim() || l`Post unavailable`
  const description = cardView?.description?.trim()
    ? cardView.description
    : undefined

  const content = ({interacting}: {interacting: boolean}) => (
    <View
      accessible={!cardView}
      accessibilityLabel={title}
      accessibilityHint=""
      style={[
        a.w_full,
        a.flex_row,
        a.align_start,
        a.gap_md,
        a.p_xs,
        a.rounded_md,
        interacting && t.atoms.bg_contrast_25,
      ]}>
      <View
        testID="standard-site-compact-document-thumbnail"
        style={[
          a.overflow_hidden,
          a.rounded_md,
          t.atoms.bg_contrast_50,
          {
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            flexShrink: 0,
          },
        ]}>
        {cardView?.thumb ? (
          <Image
            source={{uri: cardView.thumb}}
            style={[a.w_full, a.h_full]}
            contentFit="cover"
            accessible={false}
            accessibilityIgnoresInvertColors
            loading="lazy"
            useAppleWebpCodec
          />
        ) : undefined}
      </View>
      <View style={[a.flex_1, {minWidth: 0}, a.gap_2xs]}>
        <Text
          emoji
          numberOfLines={2}
          style={[a.text_sm, a.font_semi_bold, a.leading_snug]}>
          {title}
        </Text>
        {description ? (
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {description}
          </Text>
        ) : undefined}
      </View>
    </View>
  )

  if (!cardView) {
    return content({interacting: false})
  }

  return (
    <Link
      to={cardView.uri}
      label={title}
      style={[a.w_full, a.rounded_md, web({outline: 0})]}>
      {content}
    </Link>
  )
}
