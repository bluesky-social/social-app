import React from 'react'
import {observer} from 'mobx-react-lite'
import {Text, View, FlatList} from 'react-native'
import {FeedViewModel, FeedViewItemModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'
import {useStores} from '../../../state'

export const Feed = observer(function Feed({feed}: {feed: FeedViewModel}) {
  const store = useStores()

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: FeedViewItemModel}) => (
    <FeedItem item={item} />
  )
  const onRefresh = () => {
    feed.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    feed.loadMore().catch(err => console.error('Failed to load more', err))
  }
  return (
    <View>
      {feed.isLoading && !feed.isRefreshing && !feed.hasContent && (
        <Text>Loading...</Text>
      )}
      {feed.hasError && <Text>{feed.error}</Text>}
      {feed.hasContent && (
        <FlatList
          data={feed.feed.slice()}
          keyExtractor={item => item._reactKey}
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
