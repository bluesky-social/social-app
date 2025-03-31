import {useCallback, useMemo, useRef, useState} from 'react'
import {View, type ViewabilityConfig, type ViewToken} from 'react-native'
import {type AppBskyActorDefs, type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {type MetricEvents} from '#/logger/metrics'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorSearchPaginated} from '#/state/queries/actor-search'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {useProgressGuide} from '#/state/shell/progress-guide'
import {List} from '#/view/com/util/List'
import {
  FeedFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from '#/view/com/util/LoadingPlaceholder'
import {ExploreRecommendations} from '#/screens/Search/modules/ExploreRecommendations'
import {ExploreTrendingTopics} from '#/screens/Search/modules/ExploreTrendingTopics'
import {ExploreTrendingVideos} from '#/screens/Search/modules/ExploreTrendingVideos'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {UserCircle_Stroke2_Corner0_Rounded as Person} from '#/components/icons/UserCircle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import * as ModuleHeader from './components/ModuleHeader'
import {
  SuggestedAccountsTabBar,
  SuggestedProfileCard,
  useLoadEnoughProfiles,
} from './modules/ExploreSuggestedAccounts'

function LoadMore({item}: {item: ExploreScreenItems & {type: 'loadMore'}}) {
  const t = useTheme()
  const {_} = useLingui()

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
              a.justify_center,
              a.px_lg,
              a.py_md,
              a.gap_sm,
              (hovered || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <Text
              style={[
                a.leading_snug,
                hovered ? t.atoms.text : t.atoms.text_contrast_medium,
              ]}>
              {item.message}
            </Text>
            {item.isLoadingMore ? (
              <Loader size="sm" />
            ) : (
              <ChevronDownIcon
                size="sm"
                style={hovered ? t.atoms.text : t.atoms.text_contrast_medium}
              />
            )}
          </View>
        )}
      </Button>
    </View>
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
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const {
    data: suggestedProfiles,
    hasNextPage: hasNextSuggestedProfilesPage,
    isLoading: isLoadingSuggestedProfiles,
    isFetchingNextPage: isFetchingNextSuggestedProfilesPage,
    error: suggestedProfilesError,
    fetchNextPage: fetchNextSuggestedProfilesPage,
  } = useSuggestedFollowsQuery({limit: 3, subsequentPageLimit: 10})
  const {
    data: interestProfiles,
    hasNextPage: hasNextInterestProfilesPage,
    isLoading: isLoadingInterestProfiles,
    isFetchingNextPage: isFetchingNextInterestProfilesPage,
    error: interestProfilesError,
    fetchNextPage: fetchNextInterestProfilesPage,
  } = useActorSearchPaginated({
    query: selectedInterest || '',
    enabled: !!selectedInterest,
    limit: 10,
  })
  useLoadEnoughProfiles({
    interest: selectedInterest,
    data: interestProfiles,
    isLoading: isLoadingInterestProfiles,
    isFetchingNextPage: isFetchingNextInterestProfilesPage,
    hasNextPage: hasNextInterestProfilesPage,
    fetchNextPage: fetchNextInterestProfilesPage,
  })
  const {
    data: feeds,
    hasNextPage: hasNextFeedsPage,
    isLoading: isLoadingFeeds,
    isFetchingNextPage: isFetchingNextFeedsPage,
    error: feedsError,
    fetchNextPage: fetchNextFeedsPage,
  } = useGetPopularFeedsQuery({limit: 10})

  const profiles: typeof suggestedProfiles & typeof interestProfiles =
    !selectedInterest ? suggestedProfiles : interestProfiles
  const hasNextProfilesPage = !selectedInterest
    ? hasNextSuggestedProfilesPage
    : hasNextInterestProfilesPage
  const isLoadingProfiles = !selectedInterest
    ? isLoadingSuggestedProfiles
    : isLoadingInterestProfiles
  const isFetchingNextProfilesPage = !selectedInterest
    ? isFetchingNextSuggestedProfilesPage
    : isFetchingNextInterestProfilesPage
  const profilesError = !selectedInterest
    ? suggestedProfilesError
    : interestProfilesError
  const fetchNextProfilesPage = !selectedInterest
    ? fetchNextSuggestedProfilesPage
    : fetchNextInterestProfilesPage

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

  const items = useMemo<ExploreScreenItems[]>(() => {
    const i: ExploreScreenItems[] = []

    const addTopBorder = () => {
      i.push({
        type: 'topBorder',
        key: `top-border`,
      })
    }

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
        type: 'tabbedHeader',
        key: 'suggested-accounts-header',
        title: _(msg`Suggested Accounts`),
        icon: Person,
        searchButton: {
          label: _(msg`Search for more accounts`),
          metricsTag: 'suggestedAccounts',
          tab: 'user',
        },
      })

      if (profiles && moderationOpts) {
        // Currently the responses contain duplicate items.
        // Needs to be fixed on backend, but let's dedupe to be safe.
        let seen = new Set()
        const profileItems: ExploreScreenItems[] = []
        for (const page of profiles.pages) {
          for (const actor of page.actors) {
            if (!seen.has(actor.did) && !actor.viewer?.following) {
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

        if (profileItems.length === 0) {
          if (!hasNextProfilesPage) {
            // no items! remove the header
            i.pop()
          }
        } else {
          i.push(...profileItems)
        }
        if (hasNextProfilesPage) {
          i.push({
            type: 'loadMore',
            key: 'loadMoreProfiles',
            message: _(msg`Load more suggested accounts`),
            isLoadingMore: isLoadingMoreProfiles,
            onLoadMore: onLoadMoreProfiles,
          })
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
    }

    // Dynamic module ordering

    addTopBorder()

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
    moderationOpts,
    hasPressedLoadMoreFeeds,
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
        case 'tabbedHeader': {
          return (
            <View
              style={[
                a.border_b,
                t.atoms.border_contrast_low,
                a.pb_md,
                t.atoms.bg,
              ]}>
              <ModuleHeader.Container style={a.border_transparent}>
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
              />
            </View>
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
            <SuggestedProfileCard
              profile={item.profile}
              moderationOpts={moderationOpts!}
              recId={item.recId}
              position={index}
            />
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
          return <LoadMore item={item} />
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
    [t, focusSearchInput, moderationOpts, selectedInterest],
  )

  const stickyHeaderIndices = useMemo(
    () =>
      items.reduce(
        (acc, curr) =>
          ['topBorder', 'header', 'tabbedHeader'].includes(curr.type)
            ? acc.concat(items.indexOf(curr))
            : acc,
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
