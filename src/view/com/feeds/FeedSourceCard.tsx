import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  type $Typed,
  AppBskyFeedDefs,
  type AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {
  type FeedSourceInfo,
  hydrateFeedGenerator,
  hydrateList,
  useFeedSourceInfoQuery,
} from '#/state/queries/feed'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {MissingFeed} from './MissingFeed'

type FeedSourceCardProps = {
  feedUri: string
  feedData?:
    | $Typed<AppBskyFeedDefs.GeneratorView>
    | $Typed<AppBskyGraphDefs.ListView>
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
  pinOnSave?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
  link?: boolean
}

export function FeedSourceCard({
  feedUri,
  feedData,
  ...props
}: FeedSourceCardProps) {
  if (feedData) {
    let feed: FeedSourceInfo
    if (AppBskyFeedDefs.isGeneratorView(feedData)) {
      feed = hydrateFeedGenerator(feedData)
    } else {
      feed = hydrateList(feedData)
    }
    return <FeedSourceCardLoaded feedUri={feedUri} feed={feed} {...props} />
  } else {
    return <FeedSourceCardWithoutData feedUri={feedUri} {...props} />
  }
}

export function FeedSourceCardWithoutData({
  feedUri,
  ...props
}: Omit<FeedSourceCardProps, 'feedData'>) {
  const {data: feed, error} = useFeedSourceInfoQuery({
    uri: feedUri,
  })

  return (
    <FeedSourceCardLoaded
      feedUri={feedUri}
      feed={feed}
      error={error}
      {...props}
    />
  )
}

export function FeedSourceCardLoaded({
  feedUri,
  feed,
  style,
  showDescription = false,
  showLikes = false,
  showMinimalPlaceholder,
  hideTopBorder,
  link = true,
  error,
}: {
  feedUri: string
  feed?: FeedSourceInfo
  style?: StyleProp<ViewStyle>
  showDescription?: boolean
  showLikes?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
  link?: boolean
  error?: unknown
}) {
  const t = useTheme()
  const {_} = useLingui()

  /*
   * LOAD STATE
   *
   * This state also captures the scenario where a feed can't load for whatever
   * reason.
   */
  if (!feed) {
    if (error) {
      return (
        <MissingFeed
          uri={feedUri}
          style={style}
          hideTopBorder={hideTopBorder}
          error={error}
        />
      )
    }

    return (
      <FeedLoadingPlaceholder
        style={[
          t.atoms.border_contrast_low,
          !(showMinimalPlaceholder || hideTopBorder) && a.border_t,
          a.flex_1,
          style,
        ]}
        showTopBorder={false}
        showLowerPlaceholder={!showMinimalPlaceholder}
      />
    )
  }

  const inner = (
    <>
      <View style={[a.flex_row, a.align_center]}>
        <View style={[a.mr_md]}>
          <UserAvatar type="algo" size={36} avatar={feed.avatar} />
        </View>
        <View style={[a.flex_1]}>
          <Text
            emoji
            style={[a.text_sm, a.font_bold, a.leading_snug]}
            numberOfLines={1}>
            {feed.displayName}
          </Text>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}
            numberOfLines={1}>
            {feed.type === 'feed' ? (
              <Trans>Feed by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
            ) : (
              <Trans>List by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
            )}
          </Text>
        </View>
      </View>
      {showDescription && feed.description ? (
        <RichText
          style={[t.atoms.text_contrast_high, a.flex_1, a.flex_wrap]}
          value={feed.description}
          numberOfLines={3}
        />
      ) : null}
      {showLikes && feed.type === 'feed' ? (
        <Text
          style={[
            a.text_sm,
            a.font_bold,
            t.atoms.text_contrast_medium,
            a.leading_snug,
          ]}>
          <Trans>
            Liked by{' '}
            <Plural value={feed.likeCount || 0} one="# user" other="# users" />
          </Trans>
        </Text>
      ) : null}
    </>
  )

  if (link) {
    return (
      <Link
        testID={`feed-${feed.displayName}`}
        label={_(
          feed.type === 'feed'
            ? msg`${feed.displayName}, a feed by ${sanitizeHandle(feed.creatorHandle, '@')}, liked by ${feed.likeCount || 0}`
            : msg`${feed.displayName}, a list by ${sanitizeHandle(feed.creatorHandle, '@')}`,
        )}
        to={{
          screen: feed.type === 'feed' ? 'ProfileFeed' : 'ProfileList',
          params: {name: feed.creatorDid, rkey: new AtUri(feed.uri).rkey},
        }}
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          style,
        ]}>
        {inner}
      </Link>
    )
  } else {
    return (
      <View
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          style,
        ]}>
        {inner}
      </View>
    )
  }
}
