import {useCallback, useEffect, useMemo, useState} from 'react'
import {ActivityIndicator, type ListRenderItemInfo, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  type FeedNotification,
  useNotificationFeedQuery,
} from '#/state/queries/notifications/feed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListProps, type ListRef} from '#/view/com/util/List'
import {NotificationFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, platform} from '#/alf'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {NotificationFeedItem} from './NotificationFeedItem'

const EMPTY_FEED_ITEM = {type: 'empty', _reactKey: '__empty__'} as const
const LOAD_MORE_ERROR_ITEM = {
  type: 'load-more-error',
  _reactKey: '__load_more_error__',
} as const
const LOADING_ITEM = {type: 'loading', _reactKey: '__loading__'} as const

type NotificationFeedListItem =
  | FeedNotification
  | typeof EMPTY_FEED_ITEM
  | typeof LOAD_MORE_ERROR_ITEM
  | typeof LOADING_ITEM

export function NotificationFeed({
  filter,
  enabled,
  scrollElRef,
  onPressTryAgain,
  onScrolledDownChange,
  ListHeaderComponent,
  refreshNotifications,
}: {
  filter: 'all' | 'mentions'
  enabled: boolean
  scrollElRef?: ListRef
  onPressTryAgain?: () => void
  onScrolledDownChange: (isScrolledDown: boolean) => void
  ListHeaderComponent?: ListProps['ListHeaderComponent']
  refreshNotifications: () => Promise<void>
}) {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const trackPostView = usePostViewTracking('Notifications')
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
    enabled: enabled && !!moderationOpts,
    filter,
  })
  // previously, this was `!isFetching && !data?.pages[0]?.items.length`
  // however, if the first page had no items (can happen in the mentions tab!)
  // it would flicker the empty state whenever it was loading.
  // therefore, we need to find if *any* page has items. in 99.9% of cases,
  // the `.find()` won't need to go any further than the first page -sfn
  const isEmpty =
    !isFetching && !data?.pages.find(page => page.items.length > 0)

  const items = useMemo(() => {
    let arr: NotificationFeedListItem[] = []
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

  const onRefresh = useCallback(async () => {
    try {
      setIsPTRing(true)
      await refreshNotifications()
    } catch (err) {
      logger.error('Failed to refresh notifications feed', {
        message: err,
      })
    } finally {
      setIsPTRing(false)
    }
  }, [refreshNotifications, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more notifications', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<NotificationFeedListItem>) => {
      if (item.type === 'empty') {
        return (
          <EmptyState
            icon={BellIcon}
            message={l`No notifications yet!`}
            style={[a.py_5xl]}
          />
        )
      } else if (item.type === 'load-more-error') {
        return (
          <LoadMoreRetryBtn
            label={l`There was an issue fetching notifications. Tap here to try again.`}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item.type === 'loading') {
        return <NotificationFeedLoadingPlaceholder />
      }
      return (
        <NotificationFeedItem
          highlightUnread={filter === 'all'}
          item={item}
          moderationOpts={moderationOpts!}
          hideTopBorder={index === 0}
        />
      )
    },
    [moderationOpts, l, onPressRetryLoadMore, filter],
  )

  const FeedFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={[a.pt_xl]}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [isFetchingNextPage],
  )

  useEffect(() => {
    if (!enabled) {
      setIsPTRing(false)
    }
  }, [enabled])

  return (
    <View
      style={platform({
        web: {minHeight: '100%'},
        default: {height: '100%'},
      })}>
      {error && (
        <ErrorMessage
          message={cleanError(error)}
          onPressTryAgain={onPressTryAgain}
        />
      )}
      <List
        testID="notifsFeed"
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: NotificationFeedListItem) => item._reactKey}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={FeedFooter}
        refreshing={isPTRing}
        onRefresh={() => void onRefresh()}
        onEndReached={() => void onEndReached()}
        onEndReachedThreshold={2}
        onScrolledDownChange={onScrolledDownChange}
        onItemSeen={(item: NotificationFeedListItem) => {
          if (
            (item.type === 'reply' ||
              item.type === 'mention' ||
              item.type === 'quote') &&
            item.subject
          ) {
            trackPostView(item.subject)
          }
        }}
        contentContainerStyle={{paddingBottom: 200}}
        desktopFixedHeight
        initialNumToRender={initialNumToRender}
        windowSize={11}
        sideBorders={false}
        removeClippedSubviews={true}
      />
    </View>
  )
}
