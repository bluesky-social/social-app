import React from 'react'
import {CenteredView} from '../util/Views'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {EmptyState} from '../util/EmptyState'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useNotificationFeedQuery} from '#/state/queries/notifications/feed'
import {useUnreadNotificationsApi} from '#/state/queries/notifications/unread'
import {logger} from '#/logger'
import {cleanError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/queries/preferences'
import {List, ListRef} from '../util/List'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}
const LOADING_ITEM = {_reactKey: '__loading__'}

export function Feed({
  scrollElRef,
  onPressTryAgain,
  onScroll,
  onScrolledDownChange,
  ListHeaderComponent,
}: {
  scrollElRef?: ListRef
  onPressTryAgain?: () => void
  onScroll?: OnScrollHandler
  onScrolledDownChange: (isScrolledDown: boolean) => void
  ListHeaderComponent?: () => JSX.Element
}) {
  const pal = usePalette('default')
  const [isPTRing, setIsPTRing] = React.useState(false)

  const moderationOpts = useModerationOpts()
  const {checkUnread} = useUnreadNotificationsApi()
  const {
    data,
    isFetching,
    isFetched,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationFeedQuery({enabled: !!moderationOpts})
  const isEmpty = !isFetching && !data?.pages[0]?.items.length

  const items = React.useMemo(() => {
    let arr: any[] = []
    if (isFetched) {
      if (isEmpty) {
        arr = arr.concat([EMPTY_FEED_ITEM])
      } else if (data) {
        for (const page of data?.pages) {
          arr = arr.concat(page.items)
        }
      }
      if (isError && !isEmpty) {
        arr = arr.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else {
      arr.push(LOADING_ITEM)
    }
    return arr
  }, [isFetched, isError, isEmpty, data])

  const onRefresh = React.useCallback(async () => {
    try {
      setIsPTRing(true)
      await checkUnread({invalidate: true})
    } catch (err) {
      logger.error('Failed to refresh notifications feed', {
        error: err,
      })
    } finally {
      setIsPTRing(false)
    }
  }, [checkUnread, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more notifications', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        return (
          <EmptyState
            icon="bell"
            message="No notifications yet!"
            style={styles.emptyState}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching notifications. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <NotificationFeedLoadingPlaceholder />
      }
      return <FeedItem item={item} moderationOpts={moderationOpts!} />
    },
    [onPressRetryLoadMore, moderationOpts],
  )

  const FeedFooter = React.useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [isFetchingNextPage],
  )

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View style={s.hContentRegion}>
      {error && (
        <CenteredView>
          <ErrorMessage
            message={cleanError(error)}
            onPressTryAgain={onPressTryAgain}
          />
        </CenteredView>
      )}
      <List
        testID="notifsFeed"
        ref={scrollElRef}
        data={items}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={FeedFooter}
        refreshControl={
          <RefreshControl
            refreshing={isPTRing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        onScroll={scrollHandler}
        onScrolledDownChange={onScrolledDownChange}
        scrollEventThrottle={1}
        contentContainerStyle={s.contentContainer}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
      />
    </View>
  )
}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
