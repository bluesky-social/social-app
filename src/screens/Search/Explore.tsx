import {useCallback, useMemo, useRef} from 'react'
import {View, type ViewabilityConfig, type ViewToken} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  moderateProfile,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {type MetricEvents} from '#/logger/metrics'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {useProgressGuide} from '#/state/shell/progress-guide'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {
  FeedFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ExploreRecommendations} from '#/screens/Search/modules/ExploreRecommendations'
import {ExploreTrendingTopics} from '#/screens/Search/modules/ExploreTrendingTopics'
import {ExploreTrendingVideos} from '#/screens/Search/modules/ExploreTrendingVideos'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowBottom_Stroke2_Corner0_Rounded as ArrowBottom} from '#/components/icons/Arrow'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {UserCircle_Stroke2_Corner0_Rounded as Person} from '#/components/icons/UserCircle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import * as ModuleHeader from './components/ModuleHeader'

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
  const items: LoadMoreItem[] = useMemo(() => {
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
    <View style={[a.pb_2xl]}>
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
      icon: React.ComponentType<SVGIconProps>
      searchButton?: {
        label: string
        metricsTag: MetricEvents['explore:module:searchButtonPress']['module']
        tab: 'user' | 'profile' | 'feed'
      }
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
      recId?: number
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

export function Explore({
  focusSearchInput,
}: {
  focusSearchInput: (tab: 'user' | 'profile' | 'feed') => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: preferences, error: preferencesError} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const gate = useGate()
  const guide = useProgressGuide('follow-10')
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
  const onLoadMoreProfiles = useCallback(async () => {
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
  const onLoadMoreFeeds = useCallback(async () => {
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

  const items = useMemo<ExploreScreenItems[]>(() => {
    const i: ExploreScreenItems[] = []

    const addTrendingTopicsModule = () => {
      i.push({
        type: 'trendingTopics',
        key: `trending-topics`,
      })

      // temp - disable trending videos
      // if (isNative) {
      //   i.push({
      //     type: 'trendingVideos',
      //     key: `trending-videos`,
      //   })
      // }
    }

    const addSuggestedFollowsModule = () => {
      i.push({
        type: 'header',
        key: 'suggested-follows-header',
        title: _(msg`Suggested Accounts`),
        icon: Person,
        searchButton: {
          label: _(msg`Search for more accounts`),
          metricsTag: 'suggestedAccounts',
          tab: 'user',
        },
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
                recId: page.recId,
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
    }

    const addSuggestedFeedsModule = () => {
      i.push({
        type: 'header',
        key: 'suggested-feeds-header',
        title: _(msg`Discover Feeds`),
        icon: ListSparkle,
        searchButton: {
          label: _(msg`Search for more feeds`),
          metricsTag: 'suggestedFeeds',
          tab: 'feed',
        },
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
    }

    // Dynamic module ordering

    if (guide?.guide === 'follow-10' && !guide.isComplete) {
      addSuggestedFollowsModule()
      addTrendingTopicsModule()
    } else {
      addTrendingTopicsModule()
      addSuggestedFollowsModule()
    }

    if (gate('explore_show_suggested_feeds')) {
      addSuggestedFeedsModule()
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
    guide,
    gate,
  ])

  const renderItem = useCallback(
    ({item, index}: {item: ExploreScreenItems; index: number}) => {
      switch (item.type) {
        case 'header': {
          return (
            <ModuleHeader.Container>
              <ModuleHeader.Icon icon={item.icon} />
              <ModuleHeader.TitleText>{item.title}</ModuleHeader.TitleText>
              {item.searchButton && (
                <ModuleHeader.SearchButton
                  {...item.searchButton}
                  onPress={() =>
                    focusSearchInput(item.searchButton?.tab || 'user')
                  }
                />
              )}
            </ModuleHeader.Container>
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
                onPress={() => {
                  logger.metric('suggestedUser:press', {
                    logContext: 'Explore',
                    recId: item.recId,
                    position: index,
                  })
                }}
                onFollow={() => {
                  logger.metric('suggestedUser:follow', {
                    logContext: 'Explore',
                    location: 'Card',
                    recId: item.recId,
                    position: index,
                  })
                }}
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
    [t, moderationOpts, focusSearchInput],
  )

  const stickyHeaderIndices = useMemo(
    () =>
      items.reduce(
        (acc, curr) =>
          curr.type === 'header' ? acc.concat(items.indexOf(curr)) : acc,
        [] as number[],
      ),
    [items],
  )

  // track headers and report module viewability
  const alreadyReportedRef = useRef<Map<string, string>>(new Map())
  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<ExploreScreenItems>[]
      changed: ViewToken<ExploreScreenItems>[]
    }) => {
      for (const {item} of viewableItems.filter(vi => vi.isViewable)) {
        let module: MetricEvents['explore:module:seen']['module']
        if (item.type === 'trendingTopics' || item.type === 'trendingVideos') {
          module = item.type
        } else if (item.type === 'profile') {
          module = 'suggestedAccounts'
        } else if (item.type === 'feed') {
          module = 'suggestedFeeds'
        } else {
          continue
        }
        if (!alreadyReportedRef.current.has(module)) {
          alreadyReportedRef.current.set(module, module)
          logger.metric('explore:module:seen', {module})
        }
      }
    },
    [],
  )

  return (
    <List
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.key}
      desktopFixedHeight
      contentContainerStyle={{paddingBottom: 100}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      stickyHeaderIndices={stickyHeaderIndices}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
    />
  )
}

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 100,
}
