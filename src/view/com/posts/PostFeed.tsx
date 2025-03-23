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
import {AppBskyActorDefs, AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, KNOWN_SHUTDOWN_FEEDS} from '#/lib/constants'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isIOS, isNative, isWeb} from '#/platform/detection'
import {listenPostCreated} from '#/state/events'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useTrendingSettings} from '#/state/preferences/trending'
import {STALE} from '#/state/queries'
import {
  AuthorFilter,
  FeedDescriptor,
  FeedParams,
  FeedPostSlice,
  FeedPostSliceItem,
  pollLatest,
  RQKEY,
  usePostFeedQuery,
} from '#/state/queries/post-feed'
import {useSession} from '#/state/session'
import {useProgressGuide} from '#/state/shell/progress-guide'
import {List, ListRef} from '#/view/com/util/List'
import {PostFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {VideoFeedSourceContext} from '#/screens/VideoFeed/types'
import {useBreakpoints, useLayoutBreakpoints} from '#/alf'
import {ProgressGuide, SuggestedFollows} from '#/components/FeedInterstitials'
import {
  PostFeedVideoGridRow,
  PostFeedVideoGridRowPlaceholder,
} from '#/components/feeds/PostFeedVideoGridRow'
import {TrendingInterstitial} from '#/components/interstitials/Trending'
import {TrendingVideos as TrendingVideosInterstitial} from '#/components/interstitials/TrendingVideos'
import {DiscoverFallbackHeader} from './DiscoverFallbackHeader'
import {FeedShutdownMsg} from './FeedShutdownMsg'
import {PostFeedErrorMessage} from './PostFeedErrorMessage'
import {PostFeedItem} from './PostFeedItem'
import {ViewFullThread} from './ViewFullThread'

type FeedRow =
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
      type: 'fallbackMarker'
      key: string
    }
  | {
      type: 'sliceItem'
      key: string
      slice: FeedPostSlice
      indexInSlice: number
      showReplyTo: boolean
    }
  | {
      type: 'videoGridRowPlaceholder'
      key: string
    }
  | {
      type: 'videoGridRow'
      key: string
      items: FeedPostSliceItem[]
      sourceFeedUri: string
      feedContexts: (string | undefined)[]
    }
  | {
      type: 'sliceViewFullThread'
      key: string
      uri: string
    }
  | {
      type: 'interstitialFollows'
      key: string
    }
  | {
      type: 'interstitialProgressGuide'
      key: string
    }
  | {
      type: 'interstitialTrending'
      key: string
    }
  | {
      type: 'interstitialTrendingVideos'
      key: string
    }

export function getItemsForFeedback(feedRow: FeedRow):
  | {
      item: FeedPostSliceItem
      feedContext: string | undefined
    }[] {
  if (feedRow.type === 'sliceItem') {
    return feedRow.slice.items.map(item => ({
      item,
      feedContext: feedRow.slice.feedContext,
    }))
  } else if (feedRow.type === 'videoGridRow') {
    return feedRow.items.map((item, i) => ({
      item,
      feedContext: feedRow.feedContexts[i],
    }))
  } else {
    return []
  }
}

// DISABLED need to check if this is causing random feed refreshes -prf
// const REFRESH_AFTER = STALE.HOURS.ONE
const CHECK_LATEST_AFTER = STALE.SECONDS.THIRTY

let PostFeed = ({
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
  isVideoFeed = false,
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
  isVideoFeed?: boolean
}): React.ReactNode => {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {currentAccount, hasSession} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const feedFeedback = useFeedFeedbackContext()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const checkForNewRef = React.useRef<(() => void) | null>(null)
  const lastFetchRef = React.useRef<number>(Date.now())
  const [feedType, feedUriOrActorDid, feedTab] = feed.split('|')
  const {gtMobile} = useBreakpoints()
  const {rightNavVisible} = useLayoutBreakpoints()
  const areVideoFeedsEnabled = isNative

  const feedCacheKey = feedParams?.feedCacheKey
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
    // Discover always has fresh content
    if (feedUriOrActorDid === DISCOVER_FEED_URI) {
      return onHasNew?.(true)
    }

    if (!data?.pages[0] || isFetching || !onHasNew || !enabled || disablePoll) {
      return
    }
    try {
      if (await pollLatest(data.pages[0])) {
        if (isEmpty) {
          refetch()
        } else {
          onHasNew(true)
        }
      }
    } catch (e) {
      logger.error('Poll latest failed', {feed, message: String(e)})
    }
  }, [
    feed,
    data,
    isFetching,
    isEmpty,
    onHasNew,
    enabled,
    disablePoll,
    refetch,
    feedUriOrActorDid,
  ])

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
    if (enabled && !disablePoll) {
      const timeSinceFirstLoad = Date.now() - lastFetchRef.current
      if (
        (isEmpty || timeSinceFirstLoad > CHECK_LATEST_AFTER) &&
        checkForNewRef.current
      ) {
        // check for new on enable (aka on focus)
        checkForNewRef.current()
      }
    }
  }, [enabled, disablePoll, feed, queryClient, scrollElRef, isEmpty])
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

  const followProgressGuide = useProgressGuide('follow-10')
  const followAndLikeProgressGuide = useProgressGuide('like-10-and-follow-7')

  const showProgressIntersitial =
    (followProgressGuide || followAndLikeProgressGuide) && !rightNavVisible

  const {trendingDisabled, trendingVideoDisabled} = useTrendingSettings()

  const feedItems: FeedRow[] = React.useMemo(() => {
    let feedKind: 'following' | 'discover' | 'profile' | 'thevids' | undefined
    if (feedType === 'following') {
      feedKind = 'following'
    } else if (feedUriOrActorDid === DISCOVER_FEED_URI) {
      feedKind = 'discover'
    } else if (
      feedType === 'author' &&
      (feedTab === 'posts_and_author_threads' ||
        feedTab === 'posts_with_replies')
    ) {
      feedKind = 'profile'
    }

    let arr: FeedRow[] = []
    if (KNOWN_SHUTDOWN_FEEDS.includes(feedUriOrActorDid)) {
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
        let sliceIndex = -1

        if (isVideoFeed) {
          const videos: {
            item: FeedPostSliceItem
            feedContext: string | undefined
          }[] = []
          for (const page of data.pages) {
            for (const slice of page.slices) {
              const item = slice.items.find(
                item => item.uri === slice.feedPostUri,
              )
              if (item && AppBskyEmbedVideo.isView(item.post.embed)) {
                videos.push({item, feedContext: slice.feedContext})
              }
            }
          }

          const rows: {
            item: FeedPostSliceItem
            feedContext: string | undefined
          }[][] = []
          for (let i = 0; i < videos.length; i++) {
            const video = videos[i]
            const item = video.item
            const cols = gtMobile ? 3 : 2
            const rowItem = {item, feedContext: video.feedContext}
            if (i % cols === 0) {
              rows.push([rowItem])
            } else {
              rows[rows.length - 1].push(rowItem)
            }
          }

          for (const row of rows) {
            sliceIndex++
            arr.push({
              type: 'videoGridRow',
              key: row.map(r => r.item._reactKey).join('-'),
              items: row.map(r => r.item),
              sourceFeedUri: feedUriOrActorDid,
              feedContexts: row.map(r => r.feedContext),
            })
          }
        } else {
          for (const page of data?.pages) {
            for (const slice of page.slices) {
              sliceIndex++

              if (hasSession) {
                if (feedKind === 'discover') {
                  if (sliceIndex === 0) {
                    if (showProgressIntersitial) {
                      arr.push({
                        type: 'interstitialProgressGuide',
                        key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                      })
                    }
                    if (!rightNavVisible && !trendingDisabled) {
                      arr.push({
                        type: 'interstitialTrending',
                        key:
                          'interstitial2-' + sliceIndex + '-' + lastFetchedAt,
                      })
                    }
                  } else if (sliceIndex === 15) {
                    if (areVideoFeedsEnabled && !trendingVideoDisabled) {
                      arr.push({
                        type: 'interstitialTrendingVideos',
                        key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                      })
                    }
                  } else if (sliceIndex === 30) {
                    arr.push({
                      type: 'interstitialFollows',
                      key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                    })
                  }
                } else if (feedKind === 'profile') {
                  if (sliceIndex === 5) {
                    arr.push({
                      type: 'interstitialFollows',
                      key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                    })
                  }
                }
              }

              if (slice.isFallbackMarker) {
                arr.push({
                  type: 'fallbackMarker',
                  key:
                    'sliceFallbackMarker-' + sliceIndex + '-' + lastFetchedAt,
                })
              } else if (slice.isIncompleteThread && slice.items.length >= 3) {
                const beforeLast = slice.items.length - 2
                const last = slice.items.length - 1
                arr.push({
                  type: 'sliceItem',
                  key: slice.items[0]._reactKey,
                  slice: slice,
                  indexInSlice: 0,
                  showReplyTo: false,
                })
                arr.push({
                  type: 'sliceViewFullThread',
                  key: slice._reactKey + '-viewFullThread',
                  uri: slice.items[0].uri,
                })
                arr.push({
                  type: 'sliceItem',
                  key: slice.items[beforeLast]._reactKey,
                  slice: slice,
                  indexInSlice: beforeLast,
                  showReplyTo:
                    slice.items[beforeLast].parentAuthor?.did !==
                    slice.items[beforeLast].post.author.did,
                })
                arr.push({
                  type: 'sliceItem',
                  key: slice.items[last]._reactKey,
                  slice: slice,
                  indexInSlice: last,
                  showReplyTo: false,
                })
              } else {
                for (let i = 0; i < slice.items.length; i++) {
                  arr.push({
                    type: 'sliceItem',
                    key: slice.items[i]._reactKey,
                    slice: slice,
                    indexInSlice: i,
                    showReplyTo: i === 0,
                  })
                }
              }
            }
          }
        }
      }
      if (isError && !isEmpty) {
        arr.push({
          type: 'loadMoreError',
          key: 'loadMoreError',
        })
      }
    } else {
      if (isVideoFeed) {
        arr.push({
          type: 'videoGridRowPlaceholder',
          key: 'videoGridRowPlaceholder',
        })
      } else {
        arr.push({
          type: 'loading',
          key: 'loading',
        })
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
    feedUriOrActorDid,
    feedTab,
    hasSession,
    showProgressIntersitial,
    trendingDisabled,
    trendingVideoDisabled,
    rightNavVisible,
    gtMobile,
    isVideoFeed,
    areVideoFeedsEnabled,
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
    ({item: row, index: rowIndex}: ListRenderItemInfo<FeedRow>) => {
      if (row.type === 'empty') {
        return renderEmptyState()
      } else if (row.type === 'error') {
        return (
          <PostFeedErrorMessage
            feedDesc={feed}
            error={error ?? undefined}
            onPressTryAgain={onPressTryAgain}
            savedFeedConfig={savedFeedConfig}
          />
        )
      } else if (row.type === 'loadMoreError') {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching posts. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (row.type === 'loading') {
        return <PostFeedLoadingPlaceholder />
      } else if (row.type === 'feedShutdownMsg') {
        return <FeedShutdownMsg feedUri={feedUriOrActorDid} />
      } else if (row.type === 'interstitialFollows') {
        return <SuggestedFollows feed={feed} />
      } else if (row.type === 'interstitialProgressGuide') {
        return <ProgressGuide />
      } else if (row.type === 'interstitialTrending') {
        return <TrendingInterstitial />
      } else if (row.type === 'interstitialTrendingVideos') {
        return <TrendingVideosInterstitial />
      } else if (row.type === 'fallbackMarker') {
        // HACK
        // tell the user we fell back to discover
        // see home.ts (feed api) for more info
        // -prf
        return <DiscoverFallbackHeader />
      } else if (row.type === 'sliceItem') {
        const slice = row.slice
        const indexInSlice = row.indexInSlice
        const item = slice.items[indexInSlice]
        return (
          <PostFeedItem
            post={item.post}
            record={item.record}
            reason={indexInSlice === 0 ? slice.reason : undefined}
            feedContext={slice.feedContext}
            moderation={item.moderation}
            parentAuthor={item.parentAuthor}
            showReplyTo={row.showReplyTo}
            isThreadParent={isThreadParentAt(slice.items, indexInSlice)}
            isThreadChild={isThreadChildAt(slice.items, indexInSlice)}
            isThreadLastChild={
              isThreadChildAt(slice.items, indexInSlice) &&
              slice.items.length === indexInSlice + 1
            }
            isParentBlocked={item.isParentBlocked}
            isParentNotFound={item.isParentNotFound}
            hideTopBorder={rowIndex === 0 && indexInSlice === 0}
            rootPost={slice.items[0].post}
          />
        )
      } else if (row.type === 'sliceViewFullThread') {
        return <ViewFullThread uri={row.uri} />
      } else if (row.type === 'videoGridRowPlaceholder') {
        return (
          <View>
            <PostFeedVideoGridRowPlaceholder />
            <PostFeedVideoGridRowPlaceholder />
            <PostFeedVideoGridRowPlaceholder />
          </View>
        )
      } else if (row.type === 'videoGridRow') {
        let sourceContext: VideoFeedSourceContext
        if (feedType === 'author') {
          sourceContext = {
            type: 'author',
            did: feedUriOrActorDid,
            filter: feedTab as AuthorFilter,
          }
        } else {
          sourceContext = {
            type: 'feedgen',
            uri: row.sourceFeedUri,
            sourceInterstitial: feedCacheKey ?? 'none',
          }
        }

        return (
          <PostFeedVideoGridRow
            items={row.items}
            sourceContext={sourceContext}
          />
        )
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
      feedType,
      feedUriOrActorDid,
      feedTab,
      feedCacheKey,
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
        maxToRenderPerBatch={isIOS ? 5 : 1}
        updateCellsBatchingPeriod={40}
        onItemSeen={feedFeedback.onItemSeen}
      />
    </View>
  )
}
PostFeed = memo(PostFeed)
export {PostFeed}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})

function isThreadParentAt<T>(arr: Array<T>, i: number) {
  if (arr.length === 1) {
    return false
  }
  return i < arr.length - 1
}

function isThreadChildAt<T>(arr: Array<T>, i: number) {
  if (arr.length === 1) {
    return false
  }
  return i > 0
}
