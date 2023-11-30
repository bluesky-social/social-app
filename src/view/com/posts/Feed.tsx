import React, {memo, MutableRefObject} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {FeedErrorMessage} from './FeedErrorMessage'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useTheme} from 'lib/ThemeContext'
import {logger} from '#/logger'
import {
  FeedDescriptor,
  FeedParams,
  usePostFeedQuery,
  pollLatest,
} from '#/state/queries/post-feed'
import {useModerationOpts} from '#/state/queries/preferences'
import {FeedPostSlice} from '#/state/queries/post-feed'

type FeedItem =
  | {
      _reactKey: '__loading__'
    }
  | {
      _reactKey: '__empty__'
    }
  | {
      _reactKey: '__error__'
    }
  | {
      _reactKey: '__load_more_error__'
    }
  | {
      _reactKey: '__feed_slice__'
      slice: FeedPostSlice
    }

let Feed = ({
  feed,
  feedParams,
  style,
  enabled,
  pollInterval,
  scrollElRef,
  onScroll,
  onHasNew,
  scrollEventThrottle,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  desktopFixedHeightOffset,
  ListHeaderComponent,
  extraData,
}: {
  feed: FeedDescriptor
  feedParams?: FeedParams
  style?: StyleProp<ViewStyle>
  enabled?: boolean
  pollInterval?: number
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onHasNew?: (v: boolean) => void
  onScroll?: OnScrollHandler
  scrollEventThrottle?: number
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  testID?: string
  headerOffset?: number
  desktopFixedHeightOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
}): React.ReactNode => {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const checkForNewRef = React.useRef<(() => void) | null>(null)
  const isFeedDisabledRef = React.useRef<boolean>(false)

  const moderationOpts = useModerationOpts()
  const opts = React.useMemo(() => ({enabled}), [enabled])
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
  const isEmpty = !isFetching && !data?.pages[0]?.slices.length

  const checkForNew = React.useCallback(async () => {
    if (!data?.pages[0] || isFetching || !onHasNew) {
      return
    }
    try {
      if (await pollLatest(data.pages[0])) {
        onHasNew(true)
      }
    } catch (e) {
      logger.error('Poll latest failed', {feed, error: String(e)})
    }
  }, [feed, data, isFetching, onHasNew])

  React.useEffect(() => {
    // we store the interval handler in a ref to avoid needless
    // reassignments of the interval
    checkForNewRef.current = checkForNew
  }, [checkForNew])
  React.useEffect(() => {
    if (!pollInterval) {
      return
    }
    const i = setInterval(() => checkForNewRef.current?.(), pollInterval)
    return () => clearInterval(i)
  }, [pollInterval])

  const feedItems = React.useMemo(() => {
    let arr: FeedItem[] = []
    if (isFetched && moderationOpts) {
      if (isError && isEmpty) {
        arr = arr.concat([{_reactKey: '__error__'}])
      }
      if (isEmpty) {
        arr = arr.concat([{_reactKey: '__empty__'}])
      } else if (data) {
        let slices: FeedItem[] = []

        for (const page of data?.pages) {
          slices = slices.concat(
            page.slices.map(slice => ({
              _reactKey: '__feed_slice__',
              slice,
            })),
          )
        }

        arr = arr.concat(slices)
      }
      if (isError && !isEmpty) {
        arr = arr.concat([{_reactKey: '__load_more_error__'}])
      }
    } else {
      arr.push({_reactKey: '__loading__'})
    }
    return arr
  }, [isFetched, isError, isEmpty, data, moderationOpts])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    if (isFeedDisabledRef.current) return

    track('Feed:onRefresh')
    setIsPTRing(true)
    try {
      await refetch()
      onHasNew?.(false)
    } catch (err) {
      logger.error('Failed to refresh posts feed', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, track, setIsPTRing, onHasNew])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError || isFeedDisabledRef.current)
      return

    track('Feed:onEndReached')
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more posts', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage, track])

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
    ({item}: {item: FeedItem}) => {
      if (item._reactKey === '__empty__') {
        return renderEmptyState()
      } else if (item._reactKey === '__error__') {
        return (
          <FeedErrorMessage
            feedDesc={feed}
            error={error}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item._reactKey === '__load_more_error__') {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching posts. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item._reactKey === '__loading__') {
        return <PostFeedLoadingPlaceholder />
      } else if (item._reactKey === '__feed_slice__') {
        return <FeedSlice slice={item.slice} moderationOpts={moderationOpts!} />
      } else {
        return null
      }
    },
    [
      feed,
      error,
      onPressTryAgain,
      onPressRetryLoadMore,
      renderEmptyState,
      moderationOpts,
    ],
  )

  const shouldRenderEndOfFeed =
    !hasNextPage && !isEmpty && !isFetching && !isError && !!renderEndOfFeed
  const FeedFooter = React.useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : shouldRenderEndOfFeed ? (
        renderEndOfFeed()
      ) : (
        <View />
      ),
    [isFetchingNextPage, shouldRenderEndOfFeed, renderEndOfFeed],
  )

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View testID={testID} style={style}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={feedItems}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListFooterComponent={FeedFooter}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={isPTRing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
            progressViewOffset={headerOffset}
          />
        }
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        style={{paddingTop: headerOffset}}
        onScroll={onScroll != null ? scrollHandler : undefined}
        scrollEventThrottle={scrollEventThrottle}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        extraData={extraData}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight={
          desktopFixedHeightOffset ? desktopFixedHeightOffset : true
        }
      />
    </View>
  )
}
Feed = memo(Feed)
export {Feed}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
