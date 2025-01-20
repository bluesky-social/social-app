import React from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  moderateProfile,
  ModerationDecision,
  ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {
  FeedFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ExploreRecommendations} from '#/screens/Search/components/ExploreRecommendations'
import {ExploreTrendingTopics} from '#/screens/Search/components/ExploreTrendingTopics'
import {ExploreTrendingVideos} from '#/screens/Search/components/ExploreTrendingVideos'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowBottom_Stroke2_Corner0_Rounded as ArrowBottom} from '#/components/icons/Arrow'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Props as SVGIconProps} from '#/components/icons/common'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {UserCircle_Stroke2_Corner0_Rounded as Person} from '#/components/icons/UserCircle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

function SuggestedItemsHeader({
  title,
  description,
  style,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ComponentType<SVGIconProps>
} & ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        isWeb
          ? [a.flex_row, a.px_lg, a.py_lg, a.pt_2xl, a.gap_md]
          : [{flexDirection: 'row-reverse'}, a.p_lg, a.pt_2xl, a.gap_md],
        a.border_b,
        t.atoms.border_contrast_low,
        style,
      ]}>
      <View style={[a.flex_1, a.gap_sm]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Icon
            size="lg"
            fill={t.palette.primary_500}
            style={{marginLeft: -2}}
          />
          <Text style={[a.text_2xl, a.font_heavy, t.atoms.text]}>{title}</Text>
        </View>
        <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
          {description}
        </Text>
      </View>
    </View>
  )
}

type LoadMoreItem =
  | {
      type: 'profile'
      key: string
      avatar: string | undefined
      moderation: ModerationDecision
    }
  | {
      type: 'feed'
      key: string
      avatar: string | undefined
      moderation: undefined
    }

function LoadMore({
  item,
  moderationOpts,
}: {
  item: ExploreScreenItems & {type: 'loadMore'}
  moderationOpts?: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()
  const items: LoadMoreItem[] = React.useMemo(() => {
    return item.items
      .map(_item => {
        let loadMoreItem: LoadMoreItem | undefined
        if (_item.type === 'profile') {
          loadMoreItem = {
            type: 'profile',
            key: _item.profile.did,
            avatar: _item.profile.avatar,
            moderation: moderateProfile(_item.profile, moderationOpts!),
          }
        } else if (_item.type === 'feed') {
          loadMoreItem = {
            type: 'feed',
            key: _item.feed.uri,
            avatar: _item.feed.avatar,
            moderation: undefined,
          }
        }
        return loadMoreItem
      })
      .filter(n => !!n)
  }, [item.items, moderationOpts])

  if (items.length === 0) return null

  const type = items[0].type

  return (
    <View style={[]}>
      <Button
        label={_(msg`Load more`)}
        onPress={item.onLoadMore}
        style={[a.relative, a.w_full]}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.px_lg,
              a.py_md,
              (hovered || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                a.relative,
                {
                  height: 32,
                  width: 32 + 15 * items.length,
                },
              ]}>
              <View
                style={[
                  a.align_center,
                  a.justify_center,
                  t.atoms.bg_contrast_25,
                  a.absolute,
                  {
                    width: 30,
                    height: 30,
                    left: 0,
                    borderWidth: 1,
                    backgroundColor: t.palette.primary_500,
                    borderColor: t.atoms.bg.backgroundColor,
                    borderRadius: type === 'profile' ? 999 : 4,
                    zIndex: 4,
                  },
                ]}>
                <ArrowBottom fill={t.palette.white} />
              </View>
              {items.map((_item, i) => {
                return (
                  <View
                    key={_item.key}
                    style={[
                      t.atoms.bg_contrast_25,
                      a.absolute,
                      {
                        width: 30,
                        height: 30,
                        left: (i + 1) * 15,
                        borderWidth: 1,
                        borderColor: t.atoms.bg.backgroundColor,
                        borderRadius: _item.type === 'profile' ? 999 : 4,
                        zIndex: 3 - i,
                      },
                    ]}>
                    {moderationOpts && (
                      <>
                        {_item.type === 'profile' ? (
                          <UserAvatar
                            size={28}
                            avatar={_item.avatar}
                            moderation={_item.moderation.ui('avatar')}
                            type="user"
                          />
                        ) : _item.type === 'feed' ? (
                          <UserAvatar
                            size={28}
                            avatar={_item.avatar}
                            type="algo"
                          />
                        ) : null}
                      </>
                    )}
                  </View>
                )
              })}
            </View>

            <Text
              style={[
                a.pl_sm,
                a.leading_snug,
                hovered ? t.atoms.text : t.atoms.text_contrast_medium,
              ]}>
              {type === 'profile' ? (
                <Trans>Load more suggested follows</Trans>
              ) : (
                <Trans>Load more suggested feeds</Trans>
              )}
            </Text>

            <View style={[a.flex_1, a.align_end]}>
              {item.isLoadingMore && <Loader size="lg" />}
            </View>
          </View>
        )}
      </Button>
    </View>
  )
}

type ExploreScreenItems =
  | {
      type: 'header'
      key: string
      title: string
      description: string
      style?: ViewStyleProp['style']
      icon: React.ComponentType<SVGIconProps>
    }
  | {
      type: 'trendingTopics'
      key: string
    }
  | {
      type: 'trendingVideos'
      key: string
    }
  | {
      type: 'recommendations'
      key: string
    }
  | {
      type: 'profile'
      key: string
      profile: AppBskyActorDefs.ProfileView
    }
  | {
      type: 'feed'
      key: string
      feed: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'loadMore'
      key: string
      isLoadingMore: boolean
      onLoadMore: () => void
      items: ExploreScreenItems[]
    }
  | {
      type: 'profilePlaceholder'
      key: string
    }
  | {
      type: 'feedPlaceholder'
      key: string
    }
  | {
      type: 'error'
      key: string
      message: string
      error: string
    }

export function Explore() {
  const {_} = useLingui()
  const t = useTheme()
  const {data: preferences, error: preferencesError} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const {
    data: profiles,
    hasNextPage: hasNextProfilesPage,
    isLoading: isLoadingProfiles,
    isFetchingNextPage: isFetchingNextProfilesPage,
    error: profilesError,
    fetchNextPage: fetchNextProfilesPage,
  } = useSuggestedFollowsQuery({limit: 6, subsequentPageLimit: 10})
  const {
    data: feeds,
    hasNextPage: hasNextFeedsPage,
    isLoading: isLoadingFeeds,
    isFetchingNextPage: isFetchingNextFeedsPage,
    error: feedsError,
    fetchNextPage: fetchNextFeedsPage,
  } = useGetPopularFeedsQuery({limit: 10})

  const isLoadingMoreProfiles = isFetchingNextProfilesPage && !isLoadingProfiles
  const onLoadMoreProfiles = React.useCallback(async () => {
    if (isFetchingNextProfilesPage || !hasNextProfilesPage || profilesError)
      return
    try {
      await fetchNextProfilesPage()
    } catch (err) {
      logger.error('Failed to load more suggested follows', {message: err})
    }
  }, [
    isFetchingNextProfilesPage,
    hasNextProfilesPage,
    profilesError,
    fetchNextProfilesPage,
  ])

  const isLoadingMoreFeeds = isFetchingNextFeedsPage && !isLoadingFeeds
  const onLoadMoreFeeds = React.useCallback(async () => {
    if (isFetchingNextFeedsPage || !hasNextFeedsPage || feedsError) return
    try {
      await fetchNextFeedsPage()
    } catch (err) {
      logger.error('Failed to load more suggested follows', {message: err})
    }
  }, [
    isFetchingNextFeedsPage,
    hasNextFeedsPage,
    feedsError,
    fetchNextFeedsPage,
  ])

  const items = React.useMemo<ExploreScreenItems[]>(() => {
    const i: ExploreScreenItems[] = []

    i.push({
      type: 'trendingTopics',
      key: `trending-topics`,
    })

    if (isNative) {
      i.push({
        type: 'trendingVideos',
        key: `trending-videos`,
      })
    }

    i.push({
      type: 'recommendations',
      key: `recommendations`,
    })

    i.push({
      type: 'header',
      key: 'suggested-follows-header',
      title: _(msg`Suggested accounts`),
      description: _(
        msg`Follow more accounts to get connected to your interests and build your network.`,
      ),
      icon: Person,
    })

    if (profiles) {
      // Currently the responses contain duplicate items.
      // Needs to be fixed on backend, but let's dedupe to be safe.
      let seen = new Set()
      const profileItems: ExploreScreenItems[] = []
      for (const page of profiles.pages) {
        for (const actor of page.actors) {
          if (!seen.has(actor.did)) {
            seen.add(actor.did)
            profileItems.push({
              type: 'profile',
              key: actor.did,
              profile: actor,
            })
          }
        }
      }

      if (hasNextProfilesPage) {
        // splice off 3 as previews if we have a next page
        const previews = profileItems.splice(-3)
        // push remainder
        i.push(...profileItems)
        i.push({
          type: 'loadMore',
          key: 'loadMoreProfiles',
          isLoadingMore: isLoadingMoreProfiles,
          onLoadMore: onLoadMoreProfiles,
          items: previews,
        })
      } else {
        i.push(...profileItems)
      }
    } else {
      if (profilesError) {
        i.push({
          type: 'error',
          key: 'profilesError',
          message: _(msg`Failed to load suggested follows`),
          error: cleanError(profilesError),
        })
      } else {
        i.push({type: 'profilePlaceholder', key: 'profilePlaceholder'})
      }
    }

    i.push({
      type: 'header',
      key: 'suggested-feeds-header',
      title: _(msg`Discover new feeds`),
      description: _(
        msg`Choose your own timeline! Feeds built by the community help you find content you love.`,
      ),
      style: [a.pt_5xl],
      icon: ListSparkle,
    })

    if (feeds && preferences) {
      // Currently the responses contain duplicate items.
      // Needs to be fixed on backend, but let's dedupe to be safe.
      let seen = new Set()
      const feedItems: ExploreScreenItems[] = []
      for (const page of feeds.pages) {
        for (const feed of page.feeds) {
          if (!seen.has(feed.uri)) {
            seen.add(feed.uri)
            feedItems.push({
              type: 'feed',
              key: feed.uri,
              feed,
            })
          }
        }
      }

      // feeds errors can occur during pagination, so feeds is truthy
      if (feedsError) {
        i.push({
          type: 'error',
          key: 'feedsError',
          message: _(msg`Failed to load suggested feeds`),
          error: cleanError(feedsError),
        })
      } else if (preferencesError) {
        i.push({
          type: 'error',
          key: 'preferencesError',
          message: _(msg`Failed to load feeds preferences`),
          error: cleanError(preferencesError),
        })
      } else if (hasNextFeedsPage) {
        const preview = feedItems.splice(-3)
        i.push(...feedItems)
        i.push({
          type: 'loadMore',
          key: 'loadMoreFeeds',
          isLoadingMore: isLoadingMoreFeeds,
          onLoadMore: onLoadMoreFeeds,
          items: preview,
        })
      } else {
        i.push(...feedItems)
      }
    } else {
      if (feedsError) {
        i.push({
          type: 'error',
          key: 'feedsError',
          message: _(msg`Failed to load suggested feeds`),
          error: cleanError(feedsError),
        })
      } else if (preferencesError) {
        i.push({
          type: 'error',
          key: 'preferencesError',
          message: _(msg`Failed to load feeds preferences`),
          error: cleanError(preferencesError),
        })
      } else {
        i.push({type: 'feedPlaceholder', key: 'feedPlaceholder'})
      }
    }

    return i
  }, [
    _,
    profiles,
    feeds,
    preferences,
    onLoadMoreFeeds,
    onLoadMoreProfiles,
    isLoadingMoreProfiles,
    isLoadingMoreFeeds,
    profilesError,
    feedsError,
    preferencesError,
    hasNextProfilesPage,
    hasNextFeedsPage,
  ])

  const renderItem = React.useCallback(
    ({item}: {item: ExploreScreenItems}) => {
      switch (item.type) {
        case 'header': {
          return (
            <SuggestedItemsHeader
              title={item.title}
              description={item.description}
              style={item.style}
              icon={item.icon}
            />
          )
        }
        case 'trendingTopics': {
          return <ExploreTrendingTopics />
        }
        case 'trendingVideos': {
          return <ExploreTrendingVideos />
        }
        case 'recommendations': {
          return <ExploreRecommendations />
        }
        case 'profile': {
          return (
            <View style={[a.border_b, t.atoms.border_contrast_low]}>
              <ProfileCardWithFollowBtn
                profile={item.profile}
                noBg
                noBorder
                showKnownFollowers
              />
            </View>
          )
        }
        case 'feed': {
          return (
            <View
              style={[
                a.border_b,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
              ]}>
              <FeedCard.Default view={item.feed} />
            </View>
          )
        }
        case 'loadMore': {
          return <LoadMore item={item} moderationOpts={moderationOpts} />
        }
        case 'profilePlaceholder': {
          return <ProfileCardFeedLoadingPlaceholder />
        }
        case 'feedPlaceholder': {
          return <FeedFeedLoadingPlaceholder />
        }
        case 'error': {
          return (
            <View
              style={[
                a.border_t,
                a.pt_md,
                a.px_md,
                t.atoms.border_contrast_low,
              ]}>
              <View
                style={[
                  a.flex_row,
                  a.gap_md,
                  a.p_lg,
                  a.rounded_sm,
                  t.atoms.bg_contrast_25,
                ]}>
                <CircleInfo size="md" fill={t.palette.negative_400} />
                <View style={[a.flex_1, a.gap_sm]}>
                  <Text style={[a.font_bold, a.leading_snug]}>
                    {item.message}
                  </Text>
                  <Text
                    style={[
                      a.italic,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {item.error}
                  </Text>
                </View>
              </View>
            </View>
          )
        }
      }
    },
    [t, moderationOpts],
  )

  // note: actually not a screen, instead it's nested within
  // the search screen. so we don't need Layout.Screen
  return (
    <List
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.key}
      // @ts-ignore web only -prf
      desktopFixedHeight
      contentContainerStyle={{paddingBottom: 100}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}
