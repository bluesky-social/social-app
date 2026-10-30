import {type StyleProp, View, type ViewStyle} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {formatCount} from '#/view/com/util/numeric/format'
import {type ActivityView} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {Bookmark_Stroke2_Corner0_Rounded as SubscriptionIcon} from '#/components/icons/Bookmark'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Supplied content totals, never inferred from bounded actor previews or groups. */
export function ActivityCounts({
  view,
  style,
  size = 'small',
}: {
  view: ActivityView
  style?: StyleProp<ViewStyle>
  size?: 'small' | 'large'
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const article = bsky.isType(app.bsky.embed.external.viewArticle, view)
    ? view
    : undefined
  const gallery = bsky.isType(app.bsky.embed.external.viewGallery, view)
    ? view
    : undefined
  const publication = bsky.isType(
    app.bsky.embed.external.viewArticlePublication,
    view,
  )
    ? view
    : undefined
  const likeCount = article?.likeCount ?? gallery?.likeCount
  const subscriptionCount =
    article?.publisher?.subscriptionCount ?? publication?.subscriptionCount
  const large = size === 'large'

  if (likeCount === undefined && subscriptionCount === undefined) return null

  return (
    <View
      testID="atmosphereActivityCounts"
      style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_lg, style]}>
      {likeCount !== undefined ? (
        <View
          accessible
          accessibilityHint=""
          accessibilityLabel={
            article
              ? l`${plural(likeCount, {one: '# recommendation', other: '# recommendations'})}`
              : l`${plural(likeCount, {one: '# like', other: '# likes'})}`
          }
          style={[a.flex_row, a.align_center, a.gap_xs]}>
          <HeartIcon
            size={large ? 'md' : 'xs'}
            fill={t.atoms.text_contrast_low.color}
          />
          <Text
            testID="atmosphereActivityLikeCount"
            style={[
              large ? a.text_md : a.text_xs,
              large && a.font_semi_bold,
              t.atoms.text_contrast_medium,
            ]}>
            {formatCount(i18n, likeCount)}
          </Text>
        </View>
      ) : null}
      {subscriptionCount !== undefined ? (
        <View
          accessible
          accessibilityHint=""
          accessibilityLabel={l`${plural(subscriptionCount, {one: '# subscription', other: '# subscriptions'})}`}
          style={[a.flex_row, a.align_center, a.gap_xs]}>
          <SubscriptionIcon
            size={large ? 'md' : 'xs'}
            fill={t.atoms.text_contrast_low.color}
          />
          <Text
            testID="atmosphereActivitySubscriptionCount"
            style={[
              large ? a.text_md : a.text_xs,
              large && a.font_semi_bold,
              t.atoms.text_contrast_medium,
            ]}>
            {formatCount(i18n, subscriptionCount)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
