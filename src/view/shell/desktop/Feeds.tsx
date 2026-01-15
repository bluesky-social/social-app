import {Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation, useNavigationState} from '@react-navigation/native'

import {getCurrentRoute} from '#/lib/routes/helpers'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {emitSoftReset} from '#/state/events'
import {
  type SavedFeedSourceInfo,
  usePinnedFeedsInfos,
} from '#/state/queries/feed'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function DesktopFeeds() {
  const t = useTheme()
  const {_} = useLingui()
  const {data: pinnedFeedInfos, error, isLoading} = usePinnedFeedsInfos()
  const selectedFeed = useSelectedFeed()
  const setSelectedFeed = useSetSelectedFeed()
  const navigation = useNavigation<NavigationProp>()
  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  if (isLoading) {
    return (
      <View style={[{gap: 10}]}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              style={[
                a.rounded_sm,
                t.atoms.bg_contrast_25,
                {
                  height: 16,
                  width: i % 2 === 0 ? '60%' : '80%',
                },
              ]}
            />
          ))}
      </View>
    )
  }

  if (error || !pinnedFeedInfos) {
    return null
  }

  return (
    <View
      style={[
        a.flex_1,
        web({
          gap: 2,
          /*
           * Small padding prevents overflow prior to actually overflowing the
           * height of the screen with lots of feeds.
           */
          paddingTop: 2,
          overflowY: 'auto',
        }),
      ]}>
      {pinnedFeedInfos.map((feedInfo, index) => {
        const feed = feedInfo.feedDescriptor
        const current =
          route.name === 'Home' &&
          (selectedFeed ? feed === selectedFeed : index === 0)

        return (
          <FeedItem
            key={feedInfo.uri}
            feedInfo={feedInfo}
            current={current}
            onPress={() => {
              logger.metric(
                'desktopFeeds:feed:click',
                {
                  feedUri: feedInfo.uri,
                  feedDescriptor: feed,
                },
                {statsig: false},
              )
              setSelectedFeed(feed)
              navigation.navigate('Home')
              if (route.name === 'Home' && feed === selectedFeed) {
                emitSoftReset()
              }
            }}
          />
        )
      })}

      <Link
        to="/feeds"
        label={_(msg`More feeds`)}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.self_start,
          a.rounded_sm,
          {paddingVertical: 6, paddingHorizontal: 8},
          route.name === 'Feeds' && {backgroundColor: t.palette.primary_50},
        ]}>
        {({hovered}) => {
          const isActive = route.name === 'Feeds'
          return (
            <>
              <View
                style={[
                  a.align_center,
                  a.justify_center,
                  a.rounded_xs,
                  isActive
                    ? {backgroundColor: t.palette.primary_100}
                    : t.atoms.bg_contrast_50,
                  {
                    width: 20,
                    height: 20,
                  },
                ]}>
                <Plus
                  style={{width: 16, height: 16}}
                  fill={
                    isActive || hovered
                      ? t.atoms.text.color
                      : t.atoms.text_contrast_medium.color
                  }
                />
              </View>
              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  isActive
                    ? [t.atoms.text, a.font_semi_bold]
                    : hovered
                      ? t.atoms.text
                      : t.atoms.text_contrast_medium,
                ]}
                numberOfLines={1}>
                {_(msg`More feeds`)}
              </Text>
            </>
          )
        }}
      </Link>
    </View>
  )
}

function FeedItem({
  feedInfo,
  current,
  onPress,
}: {
  feedInfo: SavedFeedSourceInfo
  current: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const isFollowing = feedInfo.feedDescriptor === 'following'

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={feedInfo.displayName}
      accessibilityHint={_(msg`Opens ${feedInfo.displayName} feed`)}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.self_start,
        a.rounded_sm,
        {paddingVertical: 6, paddingHorizontal: 8},
        current && {backgroundColor: t.palette.primary_50},
      ]}>
      {isFollowing ? (
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_xs,
            {
              width: 20,
              height: 20,
              backgroundColor: t.palette.primary_500,
            },
          ]}>
          <FilterTimeline
            style={{width: 14, height: 14}}
            fill={t.palette.white}
          />
        </View>
      ) : (
        <UserAvatar
          type={feedInfo.type === 'list' ? 'list' : 'algo'}
          size={20}
          avatar={feedInfo.avatar}
          noBorder
        />
      )}
      <Text
        style={[
          a.text_md,
          a.leading_snug,
          current
            ? [t.atoms.text, a.font_semi_bold]
            : hovered
              ? t.atoms.text
              : t.atoms.text_contrast_medium,
        ]}
        numberOfLines={1}>
        {feedInfo.displayName}
      </Text>
    </Pressable>
  )
}
