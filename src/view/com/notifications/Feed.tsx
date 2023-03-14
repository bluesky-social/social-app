import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {CenteredView, FlatList} from '../util/Views'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {NotificationsViewModel} from 'state/models/notifications-view'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {EmptyState} from '../util/EmptyState'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  view,
  scrollElRef,
  onPressTryAgain,
  onScroll,
}: {
  view: NotificationsViewModel
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
}) {
  const data = React.useMemo(() => {
    let feedItems
    if (view.hasLoaded) {
      if (view.isEmpty) {
        feedItems = [EMPTY_FEED_ITEM]
      } else {
        feedItems = view.notifications
      }
    }
    return feedItems
  }, [view.hasLoaded, view.isEmpty, view.notifications])

  const onRefresh = React.useCallback(async () => {
    try {
      await view.refresh()
      await view.markAllRead()
    } catch (err) {
      view.rootStore.log.error('Failed to refresh notifications feed', err)
    }
  }, [view])
  const onEndReached = React.useCallback(async () => {
    try {
      await view.loadMore()
    } catch (err) {
      view.rootStore.log.error('Failed to load more notifications', err)
    }
  }, [view])

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = React.useCallback(({item}: {item: any}) => {
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
  }, [])

  const FeedFooter = React.useCallback(
    () =>
      view.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [view],
  )

  return (
    <View style={s.hContentRegion}>
      <CenteredView>
        {view.isLoading && !data && <NotificationFeedLoadingPlaceholder />}
        {view.hasError && (
          <ErrorMessage
            message={view.error}
            onPressTryAgain={onPressTryAgain}
          />
        )}
      </CenteredView>
      {data && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          onScroll={onScroll}
          contentContainerStyle={s.contentContainer}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
