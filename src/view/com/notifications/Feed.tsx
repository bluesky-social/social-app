import React from 'react'
import {observer} from 'mobx-react-lite'
import {Text, View, FlatList} from 'react-native'
import {
  NotificationsViewModel,
  NotificationsViewItemModel,
} from '../../../state/models/notifications-view'
import {FeedItem} from './FeedItem'

export const Feed = observer(function Feed({
  view,
}: {
  view: NotificationsViewModel
}) {
  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: NotificationsViewItemModel}) => (
    <FeedItem item={item} />
  )
  const onRefresh = () => {
    view.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    view.loadMore().catch(err => console.error('Failed to load more', err))
  }
  return (
    <View>
      {view.isLoading && !view.isRefreshing && !view.hasContent && (
        <Text>Loading...</Text>
      )}
      {view.hasError && <Text>{view.error}</Text>}
      {view.hasContent && (
        <FlatList
          data={view.notifications}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
      {view.isEmpty && <Text>This feed is empty!</Text>}
    </View>
  )
})
