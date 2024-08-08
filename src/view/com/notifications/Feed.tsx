import React from 'react'
import {
  ActivityIndicator,
  ListRenderItemInfo,
  StyleSheet,
  View,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {cleanError} from '#/lib/strings/errors'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useNotificationFeedQuery} from '#/state/queries/notifications/feed'
import {useUnreadNotificationsApi} from '#/state/queries/notifications/unread'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, ListRef} from '#/view/com/util/List'
import {NotificationFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {CenteredView} from '#/view/com/util/Views'
import {FeedItem} from './FeedItem'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}
const LOADING_ITEM = {_reactKey: '__loading__'}

export function Feed({
  scrollElRef,
  onPressTryAgain,
  onScrolledDownChange,
  ListHeaderComponent,
  overridePriorityNotifications,
}: {
  scrollElRef?: ListRef
  onPressTryAgain?: () => void
  onScrolledDownChange: (isScrolledDown: boolean) => void
  ListHeaderComponent?: () => JSX.Element
  overridePriorityNotifications?: boolean
}) {
  const initialNumToRender = useInitialNumToRender()

  const [isPTRing, setIsPTRing] = React.useState(false)
  const pal = usePalette('default')
  const {isTabletOrMobile} = useWebMediaQueries()

  const {_} = useLingui()
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
  } = useNotificationFeedQuery({
    enabled: !!moderationOpts,
    overridePriorityNotifications,
  })
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
        message: err,
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
      logger.error('Failed to load more notifications', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<any>) => {
      if (item === EMPTY_FEED_ITEM) {
        return (
          <EmptyState
            icon="bell"
            message={_(msg`No notifications yet!`)}
            style={styles.emptyState}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching notifications. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return (
          <View
            style={[
              pal.border,
              !isTabletOrMobile && {borderTopWidth: StyleSheet.hairlineWidth},
            ]}>
            <NotificationFeedLoadingPlaceholder />
          </View>
        )
      }
      return (
        <FeedItem
          item={item}
          moderationOpts={moderationOpts!}
          hideTopBorder={index === 0 && isTabletOrMobile}
        />
      )
    },
    [moderationOpts, isTabletOrMobile, _, onPressRetryLoadMore, pal.border],
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
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        onScrolledDownChange={onScrolledDownChange}
        contentContainerStyle={s.contentContainer}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
        initialNumToRender={initialNumToRender}
        windowSize={11}
        sideBorders={false}
        removeClippedSubviews={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
