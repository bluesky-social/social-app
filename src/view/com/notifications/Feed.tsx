import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, FlatList} from 'react-native'
import {
  NotificationsViewModel,
  NotificationsViewItemModel,
} from '../../../state/models/notifications-view'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/ErrorMessage'
import {EmptyState} from '../util/EmptyState'

export const Feed = observer(function Feed({
  view,
  onPressTryAgain,
}: {
  view: NotificationsViewModel
  onPressTryAgain?: () => void
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
    <View style={{flex: 1}}>
      {view.isLoading && !view.isRefreshing && (
        <NotificationFeedLoadingPlaceholder />
      )}
      {view.hasError && (
        <ErrorMessage
          dark
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onPressTryAgain}
        />
      )}
      {view.hasLoaded && (
        <FlatList
          data={view.notifications}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
      {view.hasLoaded && view.isEmpty && (
        <EmptyState icon="bell" message="No notifications yet!" />
      )}
    </View>
  )
})
