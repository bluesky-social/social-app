import {
  Linking,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import {
  type $Typed,
  AppBskyFeedDefs,
  type AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {Plural, Trans} from '@lingui/macro'

import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {usePalette} from '#/lib/hooks/usePalette'
import {sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'
import {
  type FeedSourceInfo,
  hydrateFeedGenerator,
  hydrateList,
  useFeedSourceInfoQuery,
} from '#/state/queries/feed'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {shouldClickOpenNewTab} from '#/components/Link'
import {RichText} from '#/components/RichText'

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
    return <FeedSourceCardLoaded feed={feed} {...props} />
  } else {
    return <FeedSourceCardWithoutData feedUri={feedUri} {...props} />
  }
}

export function FeedSourceCardWithoutData({
  feedUri,
  ...props
}: Omit<FeedSourceCardProps, 'feedData'>) {
  const {data: feed} = useFeedSourceInfoQuery({
    uri: feedUri,
  })

  return <FeedSourceCardLoaded feed={feed} {...props} />
}

export function FeedSourceCardLoaded({
  feed,
  style,
  showDescription = false,
  showLikes = false,
  showMinimalPlaceholder,
  hideTopBorder,
}: {
  feed?: FeedSourceInfo
  style?: StyleProp<ViewStyle>
  showDescription?: boolean
  showLikes?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
}) {
  const t = useTheme()
  const pal = usePalette('default')

  const navigation = useNavigationDeduped()

  /*
   * LOAD STATE
   *
   * This state also captures the scenario where a feed can't load for whatever
   * reason.
   */
  if (!feed)
    return (
      <View
        style={[
          pal.border,
          {
            borderTopWidth:
              showMinimalPlaceholder || hideTopBorder
                ? 0
                : StyleSheet.hairlineWidth,
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingRight: 18,
          },
        ]}>
        {showMinimalPlaceholder ? (
          <FeedLoadingPlaceholder
            style={[a.flex_1]}
            showTopBorder={false}
            showLowerPlaceholder={false}
          />
        ) : (
          <FeedLoadingPlaceholder style={[a.flex_1]} showTopBorder={false} />
        )}
      </View>
    )

  return (
    <Pressable
      testID={`feed-${feed.displayName}`}
      accessibilityRole="button"
      style={[
        a.flex_1,
        a.p_lg,
        a.gap_md,
        !hideTopBorder && !a.border_t,
        t.atoms.border_contrast_low,
        style,
      ]}
      onPress={e => {
        const shouldOpenInNewTab = shouldClickOpenNewTab(e)
        if (feed.type === 'feed') {
          if (shouldOpenInNewTab) {
            Linking.openURL(
              `/profile/${feed.creatorDid}/feed/${new AtUri(feed.uri).rkey}`,
            )
          } else {
            navigation.push('ProfileFeed', {
              name: feed.creatorDid,
              rkey: new AtUri(feed.uri).rkey,
            })
          }
        } else if (feed.type === 'list') {
          if (shouldOpenInNewTab) {
            Linking.openURL(
              `/profile/${feed.creatorDid}/lists/${new AtUri(feed.uri).rkey}`,
            )
          } else {
            navigation.push('ProfileList', {
              name: feed.creatorDid,
              rkey: new AtUri(feed.uri).rkey,
            })
          }
        }
      }}
      key={feed.uri}>
      <View style={[a.flex_row, a.align_center]}>
        <View style={[s.mr10]}>
          <UserAvatar type="algo" size={36} avatar={feed.avatar} />
        </View>
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text emoji style={[pal.text, s.bold]} numberOfLines={1}>
            {feed.displayName}
          </Text>
          <Text type="sm" style={[pal.textLight]} numberOfLines={1}>
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
        <Text type="sm-medium" style={[pal.text, pal.textLight]}>
          <Trans>
            Liked by{' '}
            <Plural value={feed.likeCount || 0} one="# user" other="# users" />
          </Trans>
        </Text>
      ) : null}
    </Pressable>
  )
}
