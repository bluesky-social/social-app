import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {niceDate} from '#/lib/strings/time'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme, utils, web} from '#/alf'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Link} from '#/components/Link'
import {StandardSiteMetaRow} from '#/components/Post/Embed/StandardSiteEmbed/StandardSiteMetaRow'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

const IMAGE_ASPECT_RATIO = 16 / 9
const PUBLICATION_ICON_SIZE = 40

/**
 * A compact document card used by grouped Activity recommendations and actor
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
  const {t: l, i18n} = useLingui()
  const cardView = view?.uri && view.title?.trim() ? view : undefined
  const title = cardView?.title?.trim() || l`Post unavailable`
  const description = cardView?.description?.trim()
    ? cardView.description
    : undefined
  const sourceTitle =
    cardView?.source?.title ||
    (cardView ? toNiceDomain(cardView.uri) : undefined)
  const sourceAccent = cardView?.source?.theme?.accentRGB
  const sourceTitleStyle = sourceAccent
    ? {
        color: utils.rgbToHex(sourceAccent.r, sourceAccent.g, sourceAccent.b),
      }
    : t.atoms.text

  const content = ({interacting}: {interacting: boolean}) => (
    <View
      testID="standard-site-compact-document-card"
      accessible={!cardView}
      accessibilityLabel={title}
      accessibilityHint=""
      style={[
        a.w_full,
        a.overflow_hidden,
        a.rounded_lg,
        a.border,
        t.atoms.bg,
        interacting
          ? [t.atoms.border_contrast_high, t.atoms.bg_contrast_25]
          : t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.p_md]}>
        <View
          style={[
            a.overflow_hidden,
            a.rounded_sm,
            t.atoms.bg_contrast_50,
            {
              width: PUBLICATION_ICON_SIZE,
              height: PUBLICATION_ICON_SIZE,
              flexShrink: 0,
            },
          ]}>
          {cardView?.source?.icon ? (
            <Image
              source={{uri: cardView.source.icon}}
              style={[a.w_full, a.h_full]}
              contentFit="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
              loading="lazy"
              useAppleWebpCodec
            />
          ) : undefined}
        </View>
        <Text
          emoji
          numberOfLines={1}
          style={[
            a.flex_1,
            a.text_lg,
            a.font_semi_bold,
            a.leading_snug,
            sourceTitleStyle,
          ]}>
          {sourceTitle}
        </Text>
        <EllipsisIcon
          size="md"
          fill={t.atoms.text_contrast_medium.color}
          aria-hidden
        />
      </View>

      <View style={[a.flex_row, a.gap_lg, a.px_md]}>
        <View
          testID="standard-site-compact-document-thumbnail"
          style={[
            a.overflow_hidden,
            a.rounded_lg,
            t.atoms.bg_contrast_50,
            {flex: 3, aspectRatio: IMAGE_ASPECT_RATIO},
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
        <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_lg, a.font_bold, a.leading_snug]}>
            {title}
          </Text>
          {description ? (
            <Text
              emoji
              numberOfLines={2}
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
              {description}
            </Text>
          ) : undefined}
        </View>
      </View>

      <View style={[a.flex_row, a.align_center, a.gap_md, a.p_md]}>
        {cardView?.createdAt ? (
          <Text
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
            {niceDate(i18n, cardView.createdAt, 'long', 'none')}
          </Text>
        ) : undefined}
        {cardView && <StandardSiteMetaRow view={cardView} />}
        {cardView?.readingTime ? (
          <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
            <Clock size="sm" style={t.atoms.text_contrast_medium} />
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
              {l({
                message: plural(cardView.readingTime, {
                  one: '#m',
                  other: '#m',
                }),
                comment:
                  'How long it takes to read an article, in minutes. Displayed in a short form, e.g. "5m".',
              })}
            </Text>
          </View>
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
      style={[a.w_full, a.rounded_lg, web({outline: 0})]}>
      {content}
    </Link>
  )
}
