import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, FlatList} from 'react-native'
import {NotificationsViewModel} from '../../../state/models/notifications-view'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/ErrorMessage'
import {EmptyState} from '../util/EmptyState'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

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
  const renderItem = ({item}: {item: any}) => {
    if (item === EMPTY_FEED_ITEM) {
      return (
        <EmptyState
          icon="bell"
          message="No notifications yet!"
          style={{paddingVertical: 40}}
        />
      )
    }
    return <FeedItem item={item} />
  }
  const onRefresh = () => {
    view.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    view.loadMore().catch(err => console.error('Failed to load more', err))
  }
  let data
  if (view.hasLoaded) {
    if (view.isEmpty) {
      data = [EMPTY_FEED_ITEM]
    } else {
      data = view.notifications
    }
  }
  return (
    <View style={{flex: 1}}>
      {view.isLoading && !data && <NotificationFeedLoadingPlaceholder />}
      {view.hasError && (
        <ErrorMessage
          dark
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onPressTryAgain}
        />
      )}
      {data && (
        <FlatList
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
    </View>
  )
})
