import React, {memo} from 'react'
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, KNOWN_SHUTDOWN_FEEDS} from '#/lib/constants'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {logEvent, useGate} from '#/lib/statsig/statsig'
import {useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {listenPostCreated} from '#/state/events'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {STALE} from '#/state/queries'
import {
  FeedDescriptor,
  FeedParams,
  FeedPostSlice,
  pollLatest,
  RQKEY,
  usePostFeedQuery,
} from '#/state/queries/post-feed'
import {useSession} from '#/state/session'
import {
  ProgressGuide,
  SuggestedFeeds,
  SuggestedFollows,
} from '#/components/FeedInterstitials'
import {List, ListRef} from '../util/List'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {DiscoverFallbackHeader} from './DiscoverFallbackHeader'
import {FeedErrorMessage} from './FeedErrorMessage'
import {FeedShutdownMsg} from './FeedShutdownMsg'
import {FeedSlice} from './FeedSlice'

type FeedItem =
  | {
      type: 'loading'
      key: string
    }
  | {
      type: 'empty'
      key: string
    }
  | {
      type: 'error'
      key: string
    }
  | {
      type: 'loadMoreError'
      key: string
    }
  | {
      type: 'feedShutdownMsg'
      key: string
    }
  | {
      type: 'slice'
      key: string
      slice: FeedPostSlice
    }
  | {
      type: 'interstitialFeeds'
      key: string
      params: {
        variant: 'default' | string
      }
      slot: number
    }
  | {
      type: 'interstitialFollows'
      key: string
      params: {
        variant: 'default' | string
      }
      slot: number
    }
  | {
      type: 'interstitialProgressGuide'
      key: string
      params: {
        variant: 'default' | string
      }
      slot: number
    }

const feedInterstitialType = 'interstitialFeeds'
const followInterstitialType = 'interstitialFollows'
const progressGuideInterstitialType = 'interstitialProgressGuide'
const interstials: Record<
  'following' | 'discover' | 'profile',
  (FeedItem & {
    type:
      | 'interstitialFeeds'
      | 'interstitialFollows'
      | 'interstitialProgressGuide'
  })[]
> = {
  following: [],
  discover: [
    {
      type: progressGuideInterstitialType,
      params: {
        variant: 'default',
      },
      key: progressGuideInterstitialType,
      slot: 0,
    },
    {
      type: followInterstitialType,
      params: {
        variant: 'default',
      },
      key: followInterstitialType,
      slot: 20,
    },
  ],
  profile: [
    {
      type: followInterstitialType,
      params: {
        variant: 'default',
      },
      key: followInterstitialType,
      slot: 5,
    },
  ],
}

export function getFeedPostSlice(feedItem: FeedItem): FeedPostSlice | null {
  if (feedItem.type === 'slice') {
    return feedItem.slice
  } else {
    return null
  }
}

// DISABLED need to check if this is causing random feed refreshes -prf
// const REFRESH_AFTER = STALE.HOURS.ONE
const CHECK_LATEST_AFTER = STALE.SECONDS.THIRTY

let Feed = ({
  feed,
  feedParams,
  ignoreFilterFor,
  style,
  enabled,
  pollInterval,
  disablePoll,
  scrollElRef,
  onScrolledDownChange,
  onHasNew,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  progressViewOffset,
  desktopFixedHeightOffset,
  ListHeaderComponent,
  extraData,
  savedFeedConfig,
  initialNumToRender: initialNumToRenderOverride,
}: {
  feed: FeedDescriptor
  feedParams?: FeedParams
  ignoreFilterFor?: string
  style?: StyleProp<ViewStyle>
  enabled?: boolean
  pollInterval?: number
  disablePoll?: boolean
  scrollElRef?: ListRef
  onHasNew?: (v: boolean) => void
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  testID?: string
  headerOffset?: number
  progressViewOffset?: number
  desktopFixedHeightOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
  savedFeedConfig?: AppBskyActorDefs.SavedFeed
  initialNumToRender?: number
}): React.ReactNode => {
  const theme = useTheme()
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {currentAccount, hasSession} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const feedFeedback = useFeedFeedbackContext()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const checkForNewRef = React.useRef<(() => void) | null>(null)
  const lastFetchRef = React.useRef<number>(Date.now())
  const [feedType, feedUri, feedTab] = feed.split('|')
  const gate = useGate()

  const opts = React.useMemo(
    () => ({enabled, ignoreFilterFor}),
    [enabled, ignoreFilterFor],
  )
  const {
    data,
    isFetching,
    isFetched,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(feed, feedParams, opts)
  const lastFetchedAt = data?.pages[0].fetchedAt
  if (lastFetchedAt) {
    lastFetchRef.current = lastFetchedAt
  }
  const isEmpty = React.useMemo(
    () => !isFetching && !data?.pages?.some(page => page.slices.length),
    [isFetching, data],
  )

  const checkForNew = React.useCallback(async () => {
    if (!data?.pages[0] || isFetching || !onHasNew || !enabled || disablePoll) {
      return
    }
    try {
      if (await pollLatest(data.pages[0])) {
        onHasNew(true)
      }
    } catch (e) {
      logger.error('Poll latest failed', {feed, message: String(e)})
    }
  }, [feed, data, isFetching, onHasNew, enabled, disablePoll])

  const myDid = currentAccount?.did || ''
  const onPostCreated = React.useCallback(() => {
    // NOTE
    // only invalidate if there's 1 page
    // more than 1 page can trigger some UI freakouts on iOS and android
    // -prf
    if (
      data?.pages.length === 1 &&
      (feed === 'following' ||
        feed === `author|${myDid}|posts_and_author_threads`)
    ) {
      queryClient.invalidateQueries({queryKey: RQKEY(feed)})
    }
  }, [queryClient, feed, data, myDid])
  React.useEffect(() => {
    return listenPostCreated(onPostCreated)
  }, [onPostCreated])

  React.useEffect(() => {
    // we store the interval handler in a ref to avoid needless
    // reassignments in other effects
    checkForNewRef.current = checkForNew
  }, [checkForNew])
  React.useEffect(() => {
    if (enabled) {
      const timeSinceFirstLoad = Date.now() - lastFetchRef.current
      // DISABLED need to check if this is causing random feed refreshes -prf
      /*if (timeSinceFirstLoad > REFRESH_AFTER) {
        // do a full refresh
        scrollElRef?.current?.scrollToOffset({offset: 0, animated: false})
        queryClient.resetQueries({queryKey: RQKEY(feed)})
      } else*/ if (
        timeSinceFirstLoad > CHECK_LATEST_AFTER &&
        checkForNewRef.current
      ) {
        // check for new on enable (aka on focus)
        checkForNewRef.current()
      }
    }
  }, [enabled, feed, queryClient, scrollElRef])
  React.useEffect(() => {
    let cleanup1: () => void | undefined, cleanup2: () => void | undefined
    const subscription = AppState.addEventListener('change', nextAppState => {
      // check for new on app foreground
      if (nextAppState === 'active') {
        checkForNewRef.current?.()
      }
    })
    cleanup1 = () => subscription.remove()
    if (pollInterval) {
      // check for new on interval
      const i = setInterval(() => checkForNewRef.current?.(), pollInterval)
      cleanup2 = () => clearInterval(i)
    }
    return () => {
      cleanup1?.()
      cleanup2?.()
    }
  }, [pollInterval])

  const feedItems: FeedItem[] = React.useMemo(() => {
    let arr: FeedItem[] = []
    if (KNOWN_SHUTDOWN_FEEDS.includes(feedUri)) {
      arr.push({
        type: 'feedShutdownMsg',
        key: 'feedShutdownMsg',
      })
    }
    if (isFetched) {
      if (isError && isEmpty) {
        arr.push({
          type: 'error',
          key: 'error',
        })
      } else if (isEmpty) {
        arr.push({
          type: 'empty',
          key: 'empty',
        })
      } else if (data) {
        for (const page of data?.pages) {
          arr = arr.concat(
            page.slices.map(s => ({
              type: 'slice',
              slice: s,
              key: s._reactKey,
            })),
          )
        }
      }
      if (isError && !isEmpty) {
        arr.push({
          type: 'loadMoreError',
          key: 'loadMoreError',
        })
      }
    } else {
      arr.push({
        type: 'loading',
        key: 'loading',
      })
    }

    if (hasSession) {
      let feedKind: 'following' | 'discover' | 'profile' | undefined
      if (feedType === 'following') {
        feedKind = 'following'
      } else if (feedUri === DISCOVER_FEED_URI) {
        feedKind = 'discover'
      } else if (
        feedType === 'author' &&
        (feedTab === 'posts_and_author_threads' ||
          feedTab === 'posts_with_replies')
      ) {
        feedKind = 'profile'
      }

      if (feedKind) {
        for (const interstitial of interstials[feedKind]) {
          const shouldShow =
            (interstitial.type === feedInterstitialType &&
              gate('suggested_feeds_interstitial')) ||
            interstitial.type === followInterstitialType ||
            interstitial.type === progressGuideInterstitialType

          if (shouldShow) {
            const variant = 'default' // replace with experiment variant
            const int = {
              ...interstitial,
              params: {variant},
              // overwrite key with unique value
              key: [interstitial.type, variant, lastFetchedAt].join(':'),
            }

            if (arr.length > interstitial.slot) {
              arr.splice(interstitial.slot, 0, int)
            }
          }
        }
      }
    }

    return arr
  }, [
    isFetched,
    isError,
    isEmpty,
    lastFetchedAt,
    data,
    feedType,
    feedUri,
    feedTab,
    gate,
    hasSession,
  ])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    logEvent('feed:refresh', {
      feedType: feedType,
      feedUrl: feed,
      reason: 'pull-to-refresh',
    })
    setIsPTRing(true)
    try {
      await refetch()
      onHasNew?.(false)
    } catch (err) {
      logger.error('Failed to refresh posts feed', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing, onHasNew, feed, feedType])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    logEvent('feed:endReached', {
      feedType: feedType,
      feedUrl: feed,
      itemCount: feedItems.length,
    })
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more posts', {message: err})
    }
  }, [
    isFetching,
    hasNextPage,
    isError,
    fetchNextPage,
    feed,
    feedType,
    feedItems.length,
  ])

  const onPressTryAgain = React.useCallback(() => {
    refetch()
    onHasNew?.(false)
  }, [refetch, onHasNew])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<FeedItem>) => {
      if (item.type === 'empty') {
        return renderEmptyState()
      } else if (item.type === 'error') {
        return (
          <FeedErrorMessage
            feedDesc={feed}
            error={error ?? undefined}
            onPressTryAgain={onPressTryAgain}
            savedFeedConfig={savedFeedConfig}
          />
        )
      } else if (item.type === 'loadMoreError') {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching posts. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item.type === 'loading') {
        return <PostFeedLoadingPlaceholder />
      } else if (item.type === 'feedShutdownMsg') {
        return <FeedShutdownMsg feedUri={feedUri} />
      } else if (item.type === feedInterstitialType) {
        return <SuggestedFeeds />
      } else if (item.type === followInterstitialType) {
        return <SuggestedFollows feed={feed} />
      } else if (item.type === progressGuideInterstitialType) {
        return <ProgressGuide />
      } else if (item.type === 'slice') {
        if (item.slice.isFallbackMarker) {
          // HACK
          // tell the user we fell back to discover
          // see home.ts (feed api) for more info
          // -prf
          return <DiscoverFallbackHeader />
        }
        return <FeedSlice slice={item.slice} hideTopBorder={index === 0} />
      } else {
        return null
      }
    },
    [
      renderEmptyState,
      feed,
      error,
      onPressTryAgain,
      savedFeedConfig,
      _,
      onPressRetryLoadMore,
      feedUri,
    ],
  )

  const shouldRenderEndOfFeed =
    !hasNextPage && !isEmpty && !isFetching && !isError && !!renderEndOfFeed
  const FeedFooter = React.useCallback(() => {
    /**
     * A bit of padding at the bottom of the feed as you scroll and when you
     * reach the end, so that content isn't cut off by the bottom of the
     * screen.
     */
    const offset = Math.max(headerOffset, 32) * (isWeb ? 1 : 2)

    return isFetchingNextPage ? (
      <View style={[styles.feedFooter]}>
        <ActivityIndicator />
        <View style={{height: offset}} />
      </View>
    ) : shouldRenderEndOfFeed ? (
      <View style={{minHeight: offset}}>{renderEndOfFeed()}</View>
    ) : (
      <View style={{height: offset}} />
    )
  }, [isFetchingNextPage, shouldRenderEndOfFeed, renderEndOfFeed, headerOffset])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={feedItems}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListFooterComponent={FeedFooter}
        ListHeaderComponent={ListHeaderComponent}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        progressViewOffset={progressViewOffset}
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        onScrolledDownChange={onScrolledDownChange}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        onEndReached={onEndReached}
        onEndReachedThreshold={2} // number of posts left to trigger load more
        removeClippedSubviews={true}
        extraData={extraData}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight={
          desktopFixedHeightOffset ? desktopFixedHeightOffset : true
        }
        initialNumToRender={initialNumToRenderOverride ?? initialNumToRender}
        windowSize={9}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={40}
        onItemSeen={feedFeedback.onItemSeen}
      />
    </View>
  )
}
Feed = memo(Feed)
export {Feed}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
