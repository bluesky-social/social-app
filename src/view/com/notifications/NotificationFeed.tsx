import {useCallback, useMemo, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
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
import {atoms as a} from '#/alf'
import {ListFooter} from '#/components/Lists'
import {NotificationFeedItem} from './NotificationFeedItem'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const LOADING_ITEM = {_reactKey: '__loading__'}

export function NotificationFeed({
  filter,
  enabled,
  scrollElRef,
  onScrolledDownChange,
  ListHeaderComponent,
  refreshNotifications,
}: {
  filter: 'all' | 'mentions'
  enabled: boolean
  scrollElRef?: ListRef
  onScrolledDownChange: (isScrolledDown: boolean) => void
  ListHeaderComponent?: ListProps['ListHeaderComponent']
  refreshNotifications: () => Promise<void>
}) {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const {
    data,
    isFetching,
    isFetched,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
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
    let arr: (FeedNotification | {_reactKey: string})[] = []
    if (isFetched) {
      if (isEmpty) {
        arr = arr.concat([EMPTY_FEED_ITEM])
      } else if (data) {
        for (const page of data?.pages) {
          arr = arr.concat(page.items)
        }
      }
    } else {
      arr.push(LOADING_ITEM)
    }
    return arr
  }, [isFetched, isEmpty, data])

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

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<FeedNotification>) => {
      if (item === EMPTY_FEED_ITEM) {
        return (
          <EmptyState
            icon="bell"
            message={_(msg`No notifications yet!`)}
            style={[a.py_5xl]}
          />
        )
      } else if (item === LOADING_ITEM) {
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
    [moderationOpts, _, filter],
  )

  return (
    <View style={a.util_screen_outer}>
      {error && isEmpty && (
        <ErrorMessage message={cleanError(error)} onPressTryAgain={refetch} />
      )}
      <List
        testID="notifsFeed"
        ref={scrollElRef}
        data={items}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={
          isFetched && !isEmpty ? (
            <ListFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              error={error && !isEmpty ? cleanError(error) : undefined}
              onRetry={fetchNextPage}
              height={260}
            />
          ) : null
        }
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        onScrolledDownChange={onScrolledDownChange}
        desktopFixedHeight
        initialNumToRender={initialNumToRender}
        windowSize={11}
        sideBorders={false}
        removeClippedSubviews={true}
      />
    </View>
  )
}
