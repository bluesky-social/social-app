import React from 'react'
import {observer} from 'mobx-react-lite'
import {FlatList, StyleSheet, View} from 'react-native'
import {NotificationsViewModel} from '../../../state/models/notifications-view'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {EmptyState} from '../util/EmptyState'
import {OnScrollCb} from '../../lib/hooks/useOnMainScroll'
import {s} from '../../lib/styles'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  view,
  onPressTryAgain,
  onScroll,
}: {
  view: NotificationsViewModel
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
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
          style={styles.emptyState}
        />
      )
    }
    return <FeedItem item={item} />
  }
  const onRefresh = () => {
    view
      .refresh()
      .catch(err =>
        view.rootStore.log.error('Failed to refresh notifications feed', err),
      )
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view.rootStore.log.error('Failed to load more notifications', err),
      )
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
    <View style={s.h100pct}>
      {view.isLoading && !data && <NotificationFeedLoadingPlaceholder />}
      {view.hasError && (
        <ErrorMessage message={view.error} onPressTryAgain={onPressTryAgain} />
      )}
      {data && (
        <FlatList
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onScroll={onScroll}
          contentContainerStyle={s.contentContainer}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  emptyState: {paddingVertical: 40},
})
