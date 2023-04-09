import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const Feed = observer(function Feed({
  feed,
  style,
  showPostFollowBtn,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  renderEmptyState,
  testID,
  headerOffset = 0,
}: {
  feed: PostsFeedModel
  style?: StyleProp<ViewStyle>
  showPostFollowBtn?: boolean
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  renderEmptyState?: () => JSX.Element
  testID?: string
  headerOffset?: number
}) {
  const pal = usePalette('default')
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
    } else if (feed.isLoading) {
      feedItems = feedItems.concat([LOADING_ITEM])
    }
    return feedItems
  }, [
    feed.hasError,
    feed.hasLoaded,
    feed.isLoading,
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
      feed.rootStore.log.error('Failed to refresh posts feed', err)
    }
    setIsRefreshing(false)
  }, [feed, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    track('Feed:onEndReached')
    try {
      await feed.loadMore()
    } catch (err) {
      feed.rootStore.log.error('Failed to load more posts', err)
    }
  }, [feed, track])

  const onPressRetryLoadMore = React.useCallback(() => {
    feed.retryLoadMore()
  }, [feed])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        if (renderEmptyState) {
          return renderEmptyState()
        }
        return <View />
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
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
      return <FeedSlice slice={item} showFollowBtn={showPostFollowBtn} />
    },
    [
      feed,
      onPressTryAgain,
      onPressRetryLoadMore,
      showPostFollowBtn,
      renderEmptyState,
    ],
  )

  const FeedFooter = React.useCallback(
    () =>
      feed.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [feed],
  )

  return (
    <View testID={testID} style={style}>
      {data.length > 0 && (
        <FlatList
          testID={testID ? `${testID}-flatlist` : undefined}
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
              progressViewOffset={headerOffset}
            />
          }
          contentContainerStyle={s.contentContainer}
          style={{paddingTop: headerOffset}}
          onScroll={onScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          removeClippedSubviews={true}
          contentOffset={{x: 0, y: headerOffset * -1}}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
