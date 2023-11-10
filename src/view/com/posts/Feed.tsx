import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
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
import {PostsFeedModel} from 'state/models/feeds/posts'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useTheme} from 'lib/ThemeContext'
import {logger} from '#/logger'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onScroll,
  scrollEventThrottle,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  desktopFixedHeightOffset,
  ListHeaderComponent,
  extraData,
}: {
  feed: PostsFeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onScroll?: OnScrollHandler
  scrollEventThrottle?: number
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  testID?: string
  headerOffset?: number
  desktopFixedHeightOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (feed.hasLoaded) {
      if (feed.hasError) {
        feedItems = feedItems.concat([ERROR_ITEM])
      }
      if (feed.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM])
      } else {
        feedItems = feedItems.concat(feed.slices)
      }
      if (feed.loadMoreError) {
        feedItems = feedItems.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else {
      feedItems.push(LOADING_ITEM)
    }
    return feedItems
  }, [
    feed.hasError,
    feed.hasLoaded,
    feed.isEmpty,
    feed.slices,
    feed.loadMoreError,
  ])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Feed:onRefresh')
    setIsRefreshing(true)
    try {
      await feed.refresh()
    } catch (err) {
      logger.error('Failed to refresh posts feed', {error: err})
    }
    setIsRefreshing(false)
  }, [feed, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    if (!feed.hasLoaded || !feed.hasMore) return

    track('Feed:onEndReached')
    try {
      await feed.loadMore()
    } catch (err) {
      logger.error('Failed to load more posts', {error: err})
    }
  }, [feed, track])

  const onPressTryAgain = React.useCallback(() => {
    feed.refresh()
  }, [feed])

  const onPressRetryLoadMore = React.useCallback(() => {
    feed.retryLoadMore()
  }, [feed])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        return renderEmptyState()
      } else if (item === ERROR_ITEM) {
        return (
          <FeedErrorMessage feed={feed} onPressTryAgain={onPressTryAgain} />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching posts. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <PostFeedLoadingPlaceholder />
      }
      return <FeedSlice slice={item} />
    },
    [feed, onPressTryAgain, onPressRetryLoadMore, renderEmptyState],
  )

  const FeedFooter = React.useCallback(
    () =>
      feed.isLoadingMore ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : !feed.hasMore && !feed.isEmpty && renderEndOfFeed ? (
        renderEndOfFeed()
      ) : (
        <View />
      ),
    [feed.isLoadingMore, feed.hasMore, feed.isEmpty, renderEndOfFeed],
  )

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View testID={testID} style={style}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={data}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListFooterComponent={FeedFooter}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
            progressViewOffset={headerOffset}
          />
        }
        contentContainerStyle={{
          paddingBottom: Dimensions.get('window').height - headerOffset,
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
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
