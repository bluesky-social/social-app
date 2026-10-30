import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {getActivityActor} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
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
  ActivityTimestamp,
} from './ActivityPrimitives'

export function LivestreamActivityRenderer({
  item,
  testID,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const first = getFirstActivity(item)
  if (!first) return null
  const record = bsky.isType(app.bsky.embed.external.viewLivestream, first.view)
    ? first.view
    : undefined
  const status = record ? getLivestreamStatus(record) : undefined
  const isActorGroup = item.type === 'group' && item.group.groupBy === 'actor'
  const actor = getActivityActor(first, item.actors)
  const actors = actor ? [actor] : []
  const title = record
    ? record.title?.trim() || l`Livestream`
    : l`Livestream unavailable`
  const href = record ? getLivestreamUrl(record) : undefined
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = item.type === 'group' ? item.group.items.length - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more livestream', other: '# more livestreams'})}`
      : undefined
  const seconds = record ? getLivestreamDurationSeconds(record) : undefined
  const duration =
    seconds === undefined
      ? undefined
      : i18n.number(seconds < 60 ? seconds : Math.floor(seconds / 60), {
          style: 'unit',
          unit: seconds < 60 ? 'second' : 'minute',
          unitDisplay: 'short',
        })
  const endedAction = duration
    ? remainingCount > 0
      ? l`streamed (first stream: ${duration})`
      : l`streamed for ${duration}`
    : l`streamed`
  const footnoteAction =
    status === 'active' ? l`started a livestream` : endedAction
  const thumb = record?.image?.trim() || undefined

  const titleContent = (
    <Text
      emoji
      numberOfLines={3}
      style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
      {title}
    </Text>
  )
  const image = thumb ? (
    <Image
      testID="atmosphereLivestreamThumbnail"
      source={{uri: thumb}}
      style={[a.rounded_md, {width: 78, height: 78}]}
      contentFit="cover"
      accessible={false}
      accessibilityIgnoresInvertColors
      loading="lazy"
      useAppleWebpCodec
    />
  ) : null

  return (
    <View testID={testID} style={a.px_xl}>
      {status === 'active' && !isActorGroup && href ? (
        <View testID="atmosphereActiveLivestream" style={a.gap_sm}>
          <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_sm]}>
            <View
              style={[
                a.px_sm,
                a.py_xs,
                a.rounded_full,
                {backgroundColor: t.palette.negative_500},
              ]}>
              <Text
                style={[
                  a.text_2xs,
                  a.font_semi_bold,
                  {color: t.palette.white},
                ]}>{l`LIVE NOW`}</Text>
            </View>
            <ActivityTimestamp timestamp={timestamp} />
          </View>
          <ActivityCard>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <View style={[a.flex_1, a.gap_sm, {minWidth: 0}]}>
                {href ? (
                  <Link
                    testID="atmosphereLivestreamTitle"
                    to={href}
                    label={title}>
                    {titleContent}
                  </Link>
                ) : (
                  titleContent
                )}
                {suffix ? (
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    {suffix}
                  </Text>
                ) : null}
                <ActivityActorLine
                  actors={actors}
                  action={l`streaming`}
                  showAvatars={false}
                />
              </View>
              {image && href ? (
                <Link to={href} label={title}>
                  {image}
                </Link>
              ) : (
                image
              )}
            </View>
          </ActivityCard>
        </View>
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
          />
        </View>
      )}
    </View>
  )
}
