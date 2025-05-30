import {useCallback, useMemo, useRef, useState} from 'react'
import {View, type ViewabilityConfig} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import * as bcp47Match from 'bcp-47-match'

import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {type MetricEvents} from '#/logger/metrics'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {RQKEY_ROOT_PAGINATED as useActorSearchPaginatedQueryKeyRoot} from '#/state/queries/actor-search'
import {
  type FeedPreviewItem,
  useFeedPreviews,
} from '#/state/queries/explore-feed-previews'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {Nux, useNux} from '#/state/queries/nuxs'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  createGetSuggestedFeedsQueryKey,
  useGetSuggestedFeedsQuery,
} from '#/state/queries/trending/useGetSuggestedFeedsQuery'
import {getSuggestedUsersQueryKeyRoot} from '#/state/queries/trending/useGetSuggestedUsersQuery'
import {createGetTrendsQueryKey} from '#/state/queries/trending/useGetTrendsQuery'
import {
  createSuggestedStarterPacksQueryKey,
  useSuggestedStarterPacksQuery,
} from '#/state/queries/useSuggestedStarterPacksQuery'
import {useProgressGuide} from '#/state/shell/progress-guide'
import {isThreadChildAt, isThreadParentAt} from '#/view/com/posts/PostFeed'
import {PostFeedItem} from '#/view/com/posts/PostFeedItem'
import {ViewFullThread} from '#/view/com/posts/ViewFullThread'
import {List} from '#/view/com/util/List'
import {FeedFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {
  popularInterests,
  useInterestsDisplayNames,
} from '#/screens/Onboarding/state'
import {
  StarterPackCard,
  StarterPackCardSkeleton,
} from '#/screens/Search/components/StarterPackCard'
import {ExploreInterestsCard} from '#/screens/Search/modules/ExploreInterestsCard'
import {ExploreRecommendations} from '#/screens/Search/modules/ExploreRecommendations'
import {ExploreTrendingTopics} from '#/screens/Search/modules/ExploreTrendingTopics'
import {ExploreTrendingVideos} from '#/screens/Search/modules/ExploreTrendingVideos'
import {useSuggestedUsers} from '#/screens/Search/util/useSuggestedUsers'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {type Props as IcoProps} from '#/components/icons/common'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {StarterPack} from '#/components/icons/StarterPack'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending'
import {UserCircle_Stroke2_Corner0_Rounded as Person} from '#/components/icons/UserCircle'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {boostInterests} from '#/components/ProgressGuide/FollowDialog'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import * as ModuleHeader from './components/ModuleHeader'
import {
  SuggestedAccountsTabBar,
  SuggestedProfileCard,
} from './modules/ExploreSuggestedAccounts'

function LoadMore({item}: {item: ExploreScreenItems & {type: 'loadMore'}}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Button
      label={_(msg`Load more`)}
      onPress={item.onLoadMore}
      style={[a.relative, a.w_full]}>
      {({hovered, pressed}) => (
        <>
          <SubtleHover hover={hovered || pressed} />
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.justify_center,
              a.px_lg,
              a.py_md,
              a.gap_sm,
            ]}>
            <Text style={[a.leading_snug]}>{item.message}</Text>
            {item.isLoadingMore ? (
              <Loader size="sm" />
            ) : (
              <ChevronDownIcon size="sm" style={t.atoms.text_contrast_medium} />
            )}
          </View>
        </>
      )}
    </Button>
  )
}

type ExploreScreenItems =
  | {
      type: 'topBorder'
      key: string
    }
  | {
      type: 'header'
      key: string
      title: string
      icon: React.ComponentType<SVGIconProps>
      iconSize?: IcoProps['size']
      bottomBorder?: boolean
      searchButton?: {
        label: string
        metricsTag: MetricEvents['explore:module:searchButtonPress']['module']
        tab: 'user' | 'profile' | 'feed'
      }
    }
  | {
      type: 'tabbedHeader'
      key: string
      title: string
      icon: React.ComponentType<SVGIconProps>
      searchButton?: {
        label: string
        metricsTag: MetricEvents['explore:module:searchButtonPress']['module']
        tab: 'user' | 'profile' | 'feed'
      }
      hideDefaultTab?: boolean
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
      type: 'profileEmpty'
      key: 'profileEmpty'
    }
  | {
      type: 'feed'
      key: string
      feed: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'loadMore'
      key: string
      message: string
      isLoadingMore: boolean
      onLoadMore: () => void
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
  | {
      type: 'starterPack'
      key: string
      view: AppBskyGraphDefs.StarterPackView
    }
  | {
      type: 'starterPackSkeleton'
      key: string
    }
  | FeedPreviewItem
  | {
      type: 'interests-card'
      key: 'interests-card'
    }

export function Explore({
  focusSearchInput,
}: {
  focusSearchInput: (tab: 'user' | 'profile' | 'feed') => void
  headerHeight: number
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: preferences, error: preferencesError} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const gate = useGate()
  const guide = useProgressGuide('follow-10')
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)

  /*
   * Begin special language handling
   */
  const {contentLanguages} = useLanguagePrefs()
  const useFullExperience = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])
  const personalizedInterests = preferences?.interests?.tags
  const interestsDisplayNames = useInterestsDisplayNames()
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(personalizedInterests))
  const {
    data: suggestedUsers,
    isLoading: suggestedUsersIsLoading,
    error: suggestedUsersError,
    isRefetching: suggestedUsersIsRefetching,
  } = useSuggestedUsers({
    category: selectedInterest || (useFullExperience ? null : interests[0]),
    search: !useFullExperience,
  })
  /* End special language handling */

  const {
    data: feeds,
    hasNextPage: hasNextFeedsPage,
    isLoading: isLoadingFeeds,
    isFetchingNextPage: isFetchingNextFeedsPage,
    error: feedsError,
    fetchNextPage: fetchNextFeedsPage,
  } = useGetPopularFeedsQuery({limit: 10, enabled: useFullExperience})
  const interestsNux = useNux(Nux.ExploreInterestsCard)
  const showInterestsNux =
    interestsNux.status === 'ready' && !interestsNux.nux?.completed

  const {
    data: suggestedSPs,
    isLoading: isLoadingSuggestedSPs,
    error: suggestedSPsError,
    isRefetching: isRefetchingSuggestedSPs,
  } = useSuggestedStarterPacksQuery({enabled: useFullExperience})

  const isLoadingMoreFeeds = isFetchingNextFeedsPage && !isLoadingFeeds
  const [hasPressedLoadMoreFeeds, setHasPressedLoadMoreFeeds] = useState(false)
  const onLoadMoreFeeds = useCallback(async () => {
    if (isFetchingNextFeedsPage || !hasNextFeedsPage || feedsError) return
    if (!hasPressedLoadMoreFeeds) {
      setHasPressedLoadMoreFeeds(true)
      return
    }
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
    hasPressedLoadMoreFeeds,
  ])

  const {data: suggestedFeeds} = useGetSuggestedFeedsQuery({
    enabled: useFullExperience,
  })
  const {
    data: feedPreviewSlices,
    query: {
      isPending: isPendingFeedPreviews,
      isFetchingNextPage: isFetchingNextPageFeedPreviews,
      fetchNextPage: fetchNextPageFeedPreviews,
      hasNextPage: hasNextPageFeedPreviews,
      error: feedPreviewSlicesError,
    },
  } = useFeedPreviews(suggestedFeeds?.feeds ?? [], useFullExperience)

  const qc = useQueryClient()
  const [isPTR, setIsPTR] = useState(false)
  const onPTR = useCallback(async () => {
    setIsPTR(true)
    await Promise.all([
      await qc.resetQueries({
        queryKey: createGetTrendsQueryKey(),
      }),
      await qc.resetQueries({
        queryKey: createSuggestedStarterPacksQueryKey(),
      }),
      await qc.resetQueries({
        queryKey: [getSuggestedUsersQueryKeyRoot],
      }),
      await qc.resetQueries({
        queryKey: [useActorSearchPaginatedQueryKeyRoot],
      }),
      await qc.resetQueries({
        queryKey: createGetSuggestedFeedsQueryKey(),
      }),
    ])
    setIsPTR(false)
  }, [qc, setIsPTR])

  const onLoadMoreFeedPreviews = useCallback(async () => {
    if (
      isPendingFeedPreviews ||
      isFetchingNextPageFeedPreviews ||
      !hasNextPageFeedPreviews ||
      feedPreviewSlicesError
    )
      return
    try {
      await fetchNextPageFeedPreviews()
    } catch (err) {
      logger.error('Failed to load more feed previews', {message: err})
    }
  }, [
    isPendingFeedPreviews,
    isFetchingNextPageFeedPreviews,
    hasNextPageFeedPreviews,
    feedPreviewSlicesError,
    fetchNextPageFeedPreviews,
  ])

  const topBorder = useMemo(
    () => ({type: 'topBorder', key: 'top-border'} as const),
    [],
  )
  const trendingTopicsModule = useMemo(
    () => ({type: 'trendingTopics', key: 'trending-topics'} as const),
    [],
  )
  const suggestedFollowsModule = useMemo(() => {
    const i: ExploreScreenItems[] = []
    i.push({
      type: 'tabbedHeader',
      key: 'suggested-accounts-header',
      title: _(msg`Suggested Accounts`),
      icon: Person,
      searchButton: {
        label: _(msg`Search for more accounts`),
        metricsTag: 'suggestedAccounts',
        tab: 'user',
      },
      hideDefaultTab: !useFullExperience,
    })

    if (suggestedUsersIsLoading || suggestedUsersIsRefetching) {
      i.push({type: 'profilePlaceholder', key: 'profilePlaceholder'})
    } else if (suggestedUsersError) {
      i.push({
        type: 'error',
        key: 'suggestedUsersError',
        message: _(msg`Failed to load suggested follows`),
        error: cleanError(suggestedUsersError),
      })
    } else {
      if (suggestedUsers !== undefined) {
        if (suggestedUsers.actors.length > 0 && moderationOpts) {
          // Currently the responses contain duplicate items.
          // Needs to be fixed on backend, but let's dedupe to be safe.
          let seen = new Set()
          const profileItems: ExploreScreenItems[] = []
          for (const actor of suggestedUsers.actors) {
            // checking for following still necessary if search data is used
            if (!seen.has(actor.did) && !actor.viewer?.following) {
              seen.add(actor.did)
              profileItems.push({
                type: 'profile',
                key: actor.did,
                profile: actor,
              })
            }
          }

          if (profileItems.length === 0) {
            i.push({
              type: 'profileEmpty',
              key: 'profileEmpty',
            })
          } else {
            if (selectedInterest === null && useFullExperience) {
              // First "For You" tab, only show 5 to keep screen short
              i.push(...profileItems.slice(0, 5))
            } else {
              i.push(...profileItems)
            }
          }
        } else {
          i.push({
            type: 'profileEmpty',
            key: 'profileEmpty',
          })
        }
      } else {
        i.push({type: 'profilePlaceholder', key: 'profilePlaceholder'})
      }
    }
    return i
  }, [
    _,
    moderationOpts,
    suggestedUsers,
    suggestedUsersIsLoading,
    suggestedUsersIsRefetching,
    suggestedUsersError,
    selectedInterest,
    useFullExperience,
  ])
  const suggestedFeedsModule = useMemo(() => {
    const i: ExploreScreenItems[] = []
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
      } else {
        if (feedItems.length === 0) {
          if (!hasNextFeedsPage) {
            i.pop()
          }
        } else {
          // This query doesn't follow the limit very well, so the first press of the
          // load more button just unslices the array back to ~10 items
          if (!hasPressedLoadMoreFeeds) {
            i.push(...feedItems.slice(0, 3))
          } else {
            i.push(...feedItems)
          }
        }
        if (hasNextFeedsPage) {
          i.push({
            type: 'loadMore',
            key: 'loadMoreFeeds',
            message: _(msg`Load more suggested feeds`),
            isLoadingMore: isLoadingMoreFeeds,
            onLoadMore: onLoadMoreFeeds,
          })
        }
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
    feeds,
    _,
    feedsError,
    hasNextFeedsPage,
    hasPressedLoadMoreFeeds,
    isLoadingMoreFeeds,
    onLoadMoreFeeds,
    preferences,
    preferencesError,
  ])
  const suggestedStarterPacksModule = useMemo(() => {
    const i: ExploreScreenItems[] = []
    i.push({
      type: 'header',
      key: 'suggested-starterPacks-header',
      title: _(msg`Starter Packs`),
      icon: StarterPack,
      iconSize: 'xl',
    })

    if (isLoadingSuggestedSPs || isRefetchingSuggestedSPs) {
      Array.from({length: 3}).forEach((__, index) =>
        i.push({
          type: 'starterPackSkeleton',
          key: `starterPackSkeleton-${index}`,
        }),
      )
    } else if (suggestedSPsError || !suggestedSPs) {
      // just get rid of the section
      i.pop()
    } else {
      suggestedSPs.starterPacks.map(s => {
        i.push({
          type: 'starterPack',
          key: s.uri,
          view: s,
        })
      })
    }
    return i
  }, [
    suggestedSPs,
    _,
    isLoadingSuggestedSPs,
    suggestedSPsError,
    isRefetchingSuggestedSPs,
  ])
  const feedPreviewsModule = useMemo(() => {
    const i: ExploreScreenItems[] = []
    i.push(...feedPreviewSlices)
    if (isFetchingNextPageFeedPreviews) {
      i.push({
        type: 'preview:loading',
        key: 'preview-loading-more',
      })
    }
    return i
  }, [feedPreviewSlices, isFetchingNextPageFeedPreviews])

  const interestsNuxModule = useMemo<ExploreScreenItems[]>(() => {
    if (!showInterestsNux) return []
    return [
      {
        type: 'interests-card',
        key: 'interests-card',
      },
    ]
  }, [showInterestsNux])

  const isNewUser = guide?.guide === 'follow-10' && !guide.isComplete
  const items = useMemo<ExploreScreenItems[]>(() => {
    const i: ExploreScreenItems[] = []

    // Dynamic module ordering

    i.push(topBorder)
    i.push(...interestsNuxModule)

    if (useFullExperience) {
      if (isNewUser) {
        i.push(...suggestedFollowsModule)
        i.push(...suggestedStarterPacksModule)
        i.push({
          type: 'header',
          key: 'trending-topics-header',
          title: _(msg`Trending topics`),
          icon: Graph,
          bottomBorder: true,
        })
        i.push(trendingTopicsModule)
      } else {
        i.push(trendingTopicsModule)
        i.push(...suggestedFollowsModule)
        i.push(...suggestedStarterPacksModule)
      }
      if (gate('explore_show_suggested_feeds')) {
        i.push(...suggestedFeedsModule)
      }
      i.push(...feedPreviewsModule)
    } else {
      i.push(...suggestedFollowsModule)
    }

    return i
  }, [
    _,
    topBorder,
    isNewUser,
    suggestedFollowsModule,
    suggestedStarterPacksModule,
    suggestedFeedsModule,
    trendingTopicsModule,
    feedPreviewsModule,
    interestsNuxModule,
    gate,
    useFullExperience,
  ])

  const renderItem = useCallback(
    ({item, index}: {item: ExploreScreenItems; index: number}) => {
      switch (item.type) {
        case 'topBorder':
          return (
            <View style={[a.w_full, t.atoms.border_contrast_low, a.border_t]} />
          )
        case 'header': {
          return (
            <ModuleHeader.Container bottomBorder={item.bottomBorder}>
              <ModuleHeader.Icon icon={item.icon} size={item.iconSize} />
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
        case 'tabbedHeader': {
          return (
            <View style={[a.pb_md]}>
              <ModuleHeader.Container style={[a.pb_xs]}>
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
              <SuggestedAccountsTabBar
                selectedInterest={selectedInterest}
                onSelectInterest={setSelectedInterest}
                hideDefaultTab={item.hideDefaultTab}
              />
            </View>
          )
        }
        case 'trendingTopics': {
          return (
            <View style={[a.pb_md]}>
              <ExploreTrendingTopics />
            </View>
          )
        }
        case 'trendingVideos': {
          return <ExploreTrendingVideos />
        }
        case 'recommendations': {
          return <ExploreRecommendations />
        }
        case 'profile': {
          return (
            <SuggestedProfileCard
              profile={item.profile}
              moderationOpts={moderationOpts!}
              recId={item.recId}
              position={index}
            />
          )
        }
        case 'profileEmpty': {
          return (
            <View style={[a.px_lg, a.pb_lg]}>
              <Admonition>
                {selectedInterest ? (
                  <Trans>
                    No results for "{interestsDisplayNames[selectedInterest]}".
                  </Trans>
                ) : (
                  <Trans>No results.</Trans>
                )}
              </Admonition>
            </View>
          )
        }
        case 'feed': {
          return (
            <View
              style={[
                a.border_t,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
              ]}>
              <FeedCard.Default view={item.feed} />
            </View>
          )
        }
        case 'starterPack': {
          return (
            <View style={[a.px_lg, a.pb_lg]}>
              <StarterPackCard view={item.view} />
            </View>
          )
        }
        case 'starterPackSkeleton': {
          return (
            <View style={[a.px_lg, a.pb_lg]}>
              <StarterPackCardSkeleton />
            </View>
          )
        }
        case 'loadMore': {
          return (
            <View style={[a.border_t, t.atoms.border_contrast_low]}>
              <LoadMore item={item} />
            </View>
          )
        }
        case 'profilePlaceholder': {
          return (
            <>
              {Array.from({length: 3}).map((__, i) => (
                <View
                  style={[
                    a.px_lg,
                    a.py_lg,
                    a.border_t,
                    t.atoms.border_contrast_low,
                  ]}
                  key={i}>
                  <ProfileCard.Outer>
                    <ProfileCard.Header>
                      <ProfileCard.AvatarPlaceholder />
                      <ProfileCard.NameAndHandlePlaceholder />
                    </ProfileCard.Header>
                    <ProfileCard.DescriptionPlaceholder numberOfLines={2} />
                  </ProfileCard.Outer>
                </View>
              ))}
            </>
          )
        }
        case 'feedPlaceholder': {
          return <FeedFeedLoadingPlaceholder />
        }
        case 'error':
        case 'preview:error': {
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
        // feed previews
        case 'preview:spacer': {
          return <View style={[a.w_full, a.pt_4xl]} />
        }
        case 'preview:empty': {
          return null // what should we do here?
        }
        case 'preview:loading': {
          return (
            <View style={[a.py_2xl, a.flex_1, a.align_center]}>
              <Loader size="lg" />
            </View>
          )
        }
        case 'preview:header': {
          return (
            <ModuleHeader.Container
              style={[
                a.pt_xs,
                t.atoms.border_contrast_low,
                native(a.border_b),
              ]}>
              {/* Very non-scientific way to avoid small gap on scroll */}
              <View style={[a.absolute, a.inset_0, t.atoms.bg, {top: -2}]} />
              <ModuleHeader.FeedLink feed={item.feed}>
                <ModuleHeader.FeedAvatar feed={item.feed} />
                <View style={[a.flex_1, a.gap_xs]}>
                  <ModuleHeader.TitleText style={[a.text_lg]}>
                    {item.feed.displayName}
                  </ModuleHeader.TitleText>
                  <ModuleHeader.SubtitleText>
                    <Trans>
                      By {sanitizeHandle(item.feed.creator.handle, '@')}
                    </Trans>
                  </ModuleHeader.SubtitleText>
                </View>
              </ModuleHeader.FeedLink>
              <ModuleHeader.PinButton feed={item.feed} />
            </ModuleHeader.Container>
          )
        }
        case 'preview:footer': {
          return (
            <View
              style={[
                a.border_t,
                t.atoms.border_contrast_low,
                a.w_full,
                a.pt_4xl,
              ]}
            />
          )
        }
        case 'preview:sliceItem': {
          const slice = item.slice
          const indexInSlice = item.indexInSlice
          const subItem = slice.items[indexInSlice]
          return (
            <PostFeedItem
              post={subItem.post}
              record={subItem.record}
              reason={indexInSlice === 0 ? slice.reason : undefined}
              feedContext={slice.feedContext}
              reqId={slice.reqId}
              moderation={subItem.moderation}
              parentAuthor={subItem.parentAuthor}
              showReplyTo={item.showReplyTo}
              isThreadParent={isThreadParentAt(slice.items, indexInSlice)}
              isThreadChild={isThreadChildAt(slice.items, indexInSlice)}
              isThreadLastChild={
                isThreadChildAt(slice.items, indexInSlice) &&
                slice.items.length === indexInSlice + 1
              }
              isParentBlocked={subItem.isParentBlocked}
              isParentNotFound={subItem.isParentNotFound}
              hideTopBorder={item.hideTopBorder}
              rootPost={slice.items[0].post}
            />
          )
        }
        case 'preview:sliceViewFullThread': {
          return <ViewFullThread uri={item.uri} />
        }
        case 'preview:loadMoreError': {
          return (
            <LoadMoreRetryBtn
              label={_(
                msg`There was an issue fetching posts. Tap here to try again.`,
              )}
              onPress={fetchNextPageFeedPreviews}
            />
          )
        }
        case 'interests-card': {
          return <ExploreInterestsCard />
        }
      }
    },
    [
      t,
      focusSearchInput,
      moderationOpts,
      selectedInterest,
      interestsDisplayNames,
      _,
      fetchNextPageFeedPreviews,
    ],
  )

  const stickyHeaderIndices = useMemo(
    () =>
      items.reduce(
        (acc, curr) =>
          ['topBorder', 'preview:header'].includes(curr.type)
            ? acc.concat(items.indexOf(curr))
            : acc,
        [] as number[],
      ),
    [items],
  )

  // track headers and report module viewability
  const alreadyReportedRef = useRef<Map<string, string>>(new Map())
  const onItemSeen = useCallback((item: ExploreScreenItems) => {
    let module: MetricEvents['explore:module:seen']['module']
    if (item.type === 'trendingTopics' || item.type === 'trendingVideos') {
      module = item.type
    } else if (item.type === 'profile') {
      module = 'suggestedAccounts'
    } else if (item.type === 'feed') {
      module = 'suggestedFeeds'
    } else if (item.type === 'starterPack') {
      module = 'suggestedStarterPacks'
    } else if (item.type === 'preview:sliceItem') {
      module = `feed:feedgen|${item.feed.uri}`
    } else {
      return
    }
    if (!alreadyReportedRef.current.has(module)) {
      alreadyReportedRef.current.set(module, module)
      logger.metric('explore:module:seen', {module}, {statsig: false})
    }
  }, [])

  return (
    <List
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      desktopFixedHeight
      contentContainerStyle={{paddingBottom: 100}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      stickyHeaderIndices={native(stickyHeaderIndices)}
      viewabilityConfig={viewabilityConfig}
      onItemSeen={onItemSeen}
      onEndReached={onLoadMoreFeedPreviews}
      /**
       * Default: 2
       */
      onEndReachedThreshold={4}
      /**
       * Default: 10
       */
      initialNumToRender={10}
      /**
       * Default: 21
       */
      windowSize={platform({android: 11})}
      /**
       * Default: 10
       */
      maxToRenderPerBatch={platform({android: 1})}
      /**
       * Default: 50
       */
      updateCellsBatchingPeriod={platform({android: 25})}
      refreshing={isPTR}
      onRefresh={onPTR}
    />
  )
}

function keyExtractor(item: FeedPreviewItem) {
  return item.key
}

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 100,
}
