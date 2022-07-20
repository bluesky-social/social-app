import React from 'react'
import {observer, Observer} from 'mobx-react-lite'
import {Text, View, FlatList} from 'react-native'
import {FeedViewModel, FeedViewItemModel} from '../../state/models/feed-view'
import {FeedItem} from './FeedItem'

export const Feed = observer(function Feed({feed}: {feed: FeedViewModel}) {
  const renderItem = ({item}: {item: FeedViewItemModel}) => (
    <Observer>{() => <FeedItem item={item} />}</Observer>
  )
  const onRefresh = () => {
    feed.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    feed.loadMore().catch(err => console.error('Failed to load more', err))
  }
  return (
    <View>
      {feed.isLoading && !feed.isRefreshing && <Text>Loading...</Text>}
      {feed.hasError && <Text>{feed.error}</Text>}
      {feed.hasContent && (
        <FlatList
          data={feed.feed}
          renderItem={renderItem}
          refreshing={feed.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
      {feed.isEmpty && <Text>This feed is empty!</Text>}
    </View>
  )
})
