import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {ACTIVITY_ROW_PADDING_START} from '#/screens/Atmosphere/constants'
import {getActivityActor} from '#/screens/Atmosphere/presentation'
import {
  getActivityContent,
  getActivityCount,
  getFirstActivity,
} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {
  getLivestreamDurationSeconds,
  getLivestreamStatus,
  getLivestreamUrl,
} from '#/screens/Atmosphere/streams'
import {atoms as a, useTheme} from '#/alf'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamIcon} from '#/components/icons/StreamingLive'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
  ActivityRowContent,
} from './ActivityPrimitives'

export function LivestreamActivityRenderer({
  item,
  testID,
  actions,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  const content = getActivityContent(item)
  if (!first || !content) return null
  const record = bsky.isType(
    app.bsky.embed.external.viewLivestream,
    content.view,
  )
    ? content.view
    : undefined
  const status = record ? getLivestreamStatus(record) : undefined
  const actor = getActivityActor(first, item.actors)
  const actors = actor ? [actor] : []
  const title = record
    ? record.title?.trim() || l`Livestream`
    : l`Livestream unavailable`
  const href = record ? getLivestreamUrl(record) : undefined
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = getActivityCount(item) - 1
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more livestream', other: '# more livestreams'})}`
      : undefined
  const seconds = record ? getLivestreamDurationSeconds(record) : undefined
  const minutes = seconds === undefined ? undefined : Math.floor(seconds / 60)
  const endedAction =
    minutes === undefined
      ? l`streamed`
      : l`streamed for ${plural(minutes, {one: '# minute', other: '# minutes'})}`
  const footnoteAction =
    status === 'active' ? l`started a livestream` : endedAction
  const thumb = record?.image?.trim() || undefined

  const titleContent = (
    <Text
      emoji
      numberOfLines={3}
      style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
      {title}
    </Text>
  )
  const image = thumb ? (
    <Image
      testID="atmosphereLivestreamThumbnail"
      source={{uri: thumb}}
      style={[
        a.w_full,
        {
          aspectRatio: 16 / 9,
          borderTopLeftRadius: a.rounded_md.borderRadius,
          borderTopRightRadius: a.rounded_md.borderRadius,
        },
      ]}
      contentFit="cover"
      accessible={false}
      accessibilityIgnoresInvertColors
      loading="lazy"
      useAppleWebpCodec
    />
  ) : null

  return (
    <View
      testID={testID}
      style={[a.pr_lg, {paddingLeft: ACTIVITY_ROW_PADDING_START}]}>
      {href ? (
        <ActivityRowContent
          actors={actors}
          icon={StreamIcon}
          iconColor={status === 'active' ? t.palette.negative_500 : undefined}
          actions={actions}
          header={
            <View style={[a.flex_row, a.flex_wrap, a.align_start, a.gap_sm]}>
              <View style={[a.flex_1, {minWidth: 120}]}>
                <ActivityActorLine
                  actors={actors}
                  action={status === 'active' ? l`streaming` : endedAction}
                  timestamp={timestamp}
                  showAvatars={false}
                />
              </View>
              {status === 'active' ? (
                <View
                  style={[
                    a.flex_shrink_0,
                    a.px_sm,
                    a.py_xs,
                    a.rounded_full,
                    {backgroundColor: t.palette.negative_500},
                  ]}>
                  <Text
                    style={[
                      a.text_xs,
                      a.font_semi_bold,
                      {color: t.palette.white},
                    ]}>{l`LIVE NOW`}</Text>
                </View>
              ) : null}
            </View>
          }>
          <View
            testID={
              status === 'active'
                ? 'atmosphereActiveLivestream'
                : 'atmosphereEndedLivestream'
            }>
            <ActivityCard padded={false}>
              <Link
                testID="atmosphereLivestreamTitle"
                to={href}
                label={title}
                style={[a.flex_col, a.align_start, a.w_full, a.rounded_md]}>
                {image}
                <View style={[a.w_full, a.p_lg, a.gap_md]}>
                  {titleContent}
                  {suffix ? (
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {suffix}
                    </Text>
                  ) : null}
                </View>
              </Link>
            </ActivityCard>
          </View>
        </ActivityRowContent>
      ) : (
        <View
          testID={
            status === 'ended'
              ? 'atmosphereEndedLivestream'
              : record
                ? 'atmosphereLivestreamSummary'
                : 'atmosphereUnavailableLivestream'
          }>
          <ActivityFootnote
            title={title}
            to={href}
            icon={StreamIcon}
            actors={actors}
            action={footnoteAction}
            timestamp={timestamp}
            suffix={suffix}
            actions={actions}
          />
        </View>
      )}
    </View>
  )
}
