import {useState} from 'react'
import {View} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {formatCount} from '#/view/com/util/numeric/format'
import {getActivityPostView} from '#/screens/Atmosphere/externalViews'
import {getSharePostHref} from '#/screens/Atmosphere/relationships'
import {type ActivityActor, type ActivityItem} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {Button, ButtonText} from '#/components/Button'
import {Mark as BlueskyIcon} from '#/components/icons/brands/Mark'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Reply_Stroke2_Corner0_Rounded as ReplyIcon} from '#/components/icons/Reply'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Link, useLink} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ActivityActorLine} from './ActivityPrimitives'

type Share = {
  activity: ActivityItem
  actor: ActivityActor
}

const INITIAL_SHARE_COUNT = 2

export function ShareSnippets({
  shares,
  showActorMetadata = true,
  hideActorMetadataForDid,
}: {
  shares: Share[]
  showActorMetadata?: boolean
  hideActorMetadataForDid?: string
}) {
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const validShares = shares.flatMap(share => {
    const post = getActivityPostView(share.activity)
    const href = getSharePostHref(share.activity, share.actor)
    return post && bsky.isType(app.bsky.feed.post, post.record) && href
      ? [{...share, record: post.record, post, href}]
      : []
  })
  if (validShares.length === 0) return null

  const visibleShares = expanded
    ? validShares
    : validShares.slice(0, INITIAL_SHARE_COUNT)
  const remainingCount = validShares.length - INITIAL_SHARE_COUNT
  const hasOverflow = remainingCount > 0

  return (
    <View style={[a.gap_lg]}>
      {visibleShares.map(share => (
        <ShareSnippet
          key={share.activity.record.uri}
          share={share}
          showActorMetadata={
            showActorMetadata && share.actor.did !== hideActorMetadataForDid
          }
        />
      ))}
      {hasOverflow ? (
        <Button
          testID={
            expanded ? 'atmosphereShareCollapse' : 'atmosphereShareExpand'
          }
          size="tiny"
          color="secondary"
          shape="rectangular"
          label={
            expanded
              ? l`Show fewer posts`
              : l`${plural(remainingCount, {
                  one: '# more post',
                  other: '# more posts',
                })}`
          }
          onPress={() => setExpanded(value => !value)}>
          <ButtonText>
            {expanded
              ? l`Show fewer posts`
              : l`${plural(remainingCount, {
                  one: '# more post',
                  other: '# more posts',
                })}`}
          </ButtonText>
        </Button>
      ) : null}
    </View>
  )
}

type ValidShare = Share & {
  record: app.bsky.feed.post.Main
  post: app.bsky.feed.defs.PostView
  href: string
}

function ShareSnippet({
  share,
  showActorMetadata,
}: {
  share: ValidShare
  showActorMetadata: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {onPress: openThread} = useLink({
    to: share.href,
    displayText: l`View post`,
  })
  const richText = new RichTextAPI({
    text: share.record.text,
    facets: share.record.facets,
  })
  const emojiOnly = !richText.facets?.length && isOnlyEmoji(richText.text)

  return (
    <View testID="atmosphereShareSnippet" style={[a.gap_md]}>
      {showActorMetadata ? (
        <ActivityActorLine
          actors={[share.actor]}
          action={l`shared`}
          timestamp={share.activity.record.indexedAt}
          showAvatars={false}
        />
      ) : null}
      {share.record.text.trim() ? (
        <Button
          role="link"
          accessibilityRole="link"
          testID="atmosphereShareQuote"
          label={share.record.text}
          style={[a.w_full, a.justify_start, a.rounded_md, a.p_md, t.atoms.bg]}
          onPress={event => {
            if (!event.defaultPrevented) openThread(event)
          }}>
          <View style={[a.flex_1, a.gap_sm]}>
            {emojiOnly ? (
              <Text
                testID="atmosphereShareText"
                emoji
                numberOfLines={4}
                style={[a.text_md, a.leading_snug, t.atoms.text]}>
                {share.record.text}
              </Text>
            ) : (
              <RichText
                testID="atmosphereShareText"
                value={richText}
                enableTags
                authorHandle={share.actor.handle}
                shouldProxyLinks
                onLinkPress={event => {
                  event.preventDefault()
                }}
                numberOfLines={4}
                style={[a.text_md, a.leading_snug, t.atoms.text]}
              />
            )}
            <ShareMetrics view={share.post} />
          </View>
        </Button>
      ) : (
        <View style={[a.gap_sm]}>
          <Link to={share.href} label={l`View post`} style={[a.justify_start]}>
            <Text style={[a.text_sm, a.font_semi_bold]}>{l`View post`}</Text>
          </Link>
          <ShareMetrics view={share.post} />
        </View>
      )}
    </View>
  )
}

function ShareMetrics({view}: {view: app.bsky.feed.defs.PostView}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()

  return (
    <View
      testID="atmosphereShareMetrics"
      style={[a.flex_row, a.align_center, a.justify_start, a.gap_lg]}>
      {view.likeCount !== undefined ? (
        <View
          testID="atmosphereShareLikeMetric"
          style={[a.flex_row, a.align_center, a.gap_xs]}>
          <HeartIcon
            testID="atmosphereShareLikeIcon"
            size="xs"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text
            testID="atmosphereShareLikeCount"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {formatCount(i18n, view.likeCount)}
          </Text>
        </View>
      ) : null}
      {view.repostCount !== undefined ? (
        <View
          testID="atmosphereShareRepostMetric"
          style={[a.flex_row, a.align_center, a.gap_xs]}>
          <RepostIcon
            testID="atmosphereShareRepostIcon"
            size="xs"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text
            testID="atmosphereShareRepostCount"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {formatCount(i18n, view.repostCount)}
          </Text>
        </View>
      ) : null}
      {view.replyCount !== undefined ? (
        <View
          testID="atmosphereShareReplyMetric"
          style={[a.flex_row, a.align_center, a.gap_xs]}>
          <ReplyIcon
            testID="atmosphereShareReplyIcon"
            size="xs"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text
            testID="atmosphereShareReplyCount"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {formatCount(i18n, view.replyCount)}
          </Text>
        </View>
      ) : null}
      <View
        testID="atmosphereShareBlueskyAttribution"
        style={[a.flex_row, a.align_center, a.gap_xs, a.ml_auto]}>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{l`via`}</Text>
        <BlueskyIcon
          testID="atmosphereShareBlueskyIcon"
          size="xs"
          fill={t.palette.primary_500}
        />
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {l`Bluesky`}
        </Text>
      </View>
    </View>
  )
}
