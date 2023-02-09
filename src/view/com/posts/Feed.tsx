import React, {MutableRefObject, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  View,
  FlatList,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {FeedModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'
import {OnScrollCb} from '../../lib/hooks/useOnMainScroll'
import {s} from '../../lib/styles'
import {useAnalytics} from '@segment/analytics-react-native'

const HEADER_SPACER_ITEM = {_reactKey: '__spacer__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  testID,
  headerSpacer,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  testID?: string
  headerSpacer?: boolean
}) {
  const {screen, track} = useAnalytics()

  useEffect(() => {
    screen('Feed')
  }, [screen])

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: any}) => {
    if (item === EMPTY_FEED_ITEM) {
      return (
        <EmptyState
          icon="bars"
          message="This feed is empty!"
          style={styles.emptyState}
        />
      )
    }
    if (item === HEADER_SPACER_ITEM) {
      return <View style={styles.headerSpacer} />
    } else {
      return <FeedItem item={item} />
    }
  }
  const onRefresh = () => {
    track('Feed:onRefresh')
    feed
      .refresh()
      .catch(err =>
        feed.rootStore.log.error('Failed to refresh posts feed', err),
      )
  }
  const onEndReached = () => {
    track('Feed:onEndReached')
    feed
      .loadMore()
      .catch(err => feed.rootStore.log.error('Failed to load more posts', err))
  }
  let data = []
  if (headerSpacer) {
    data.push(HEADER_SPACER_ITEM)
  }
  if (feed.hasLoaded) {
    if (feed.isEmpty) {
      data.push(EMPTY_FEED_ITEM)
    } else {
      data = data.concat(feed.feed)
    }
  }
  const FeedFooter = () =>
    feed.isLoading ? (
      <View style={styles.feedFooter}>
        <ActivityIndicator />
      </View>
    ) : (
      <View />
    )
  return (
    <View testID={testID} style={style}>
      {feed.isLoading && !data && <PostFeedLoadingPlaceholder />}
      {feed.hasError && (
        <ErrorMessage message={feed.error} onPressTryAgain={onPressTryAgain} />
      )}
      {feed.hasLoaded && data && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={feed.isRefreshing}
          contentContainerStyle={s.contentContainer}
          onScroll={onScroll}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          removeClippedSubviews={true}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  headerSpacer: {height: 42},
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
