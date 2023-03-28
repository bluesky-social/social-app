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
import {FeedModel} from 'state/models/feed-view'
import {FeedSlice} from './FeedSlice'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}

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
  feed: FeedModel
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
    } else if (feed.isLoading) {
      feedItems = feedItems.concat([LOADING_ITEM])
    }
    return feedItems
  }, [feed.hasError, feed.hasLoaded, feed.isLoading, feed.isEmpty, feed.slices])

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
      } else if (item === LOADING_ITEM) {
        return <PostFeedLoadingPlaceholder />
      }
      return <FeedSlice slice={item} showFollowBtn={showPostFollowBtn} />
    },
    [feed, onPressTryAgain, showPostFollowBtn, renderEmptyState],
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
            />
          }
          contentContainerStyle={s.contentContainer}
          onScroll={onScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          removeClippedSubviews={true}
          contentInset={{top: headerOffset}}
          contentOffset={{x: 0, y: headerOffset * -1}}
          progressViewOffset={headerOffset}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
