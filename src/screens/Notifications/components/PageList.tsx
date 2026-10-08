import {useEffect, useEffectEvent, useRef, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {isToday} from 'date-fns'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  refreshGroupedNotifications,
  useGroupedNotificationsQuery,
} from '#/state/queries/notifications/grouped'
import {
  type GroupedNotificationsFeed,
  type NotificationView,
} from '#/state/queries/notifications/grouped/types'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {NotificationFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {NotificationItem} from '#/screens/Notifications/components/NotificationItem'
import {usePager} from '#/screens/Notifications/components/PagerView'
import {atoms as a, useTheme} from '#/alf'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

type Row =
  | {type: 'section'; key: string; section: 'today' | 'earlier'}
  | {type: 'notification'; key: string; notification: NotificationView}
  | {type: 'loading'; key: string}
  | {type: 'empty'; key: string}
  | {type: 'error'; key: string}
  | {type: 'loadMoreError'; key: string}

/**
 * A load of a tab's notifications, reported so the screen can snapshot
 * `seenAt` and mark notifications as seen.
 */
export type PageLoad = {
  feed: GroupedNotificationsFeed
  /**
   * The server's `seenAt` at the time of the request.
   */
  serverSeenAt: string | undefined
  /**
   * When the response arrived; everything up to here has been shown.
   */
  fetchedAt: number
}

/**
 * One tab of the notifications pager: the grouped notifications for `feed`,
 * split into "Today" and "Earlier".
 */
export function PageList({
  feed,
  pageIndex,
  headerOffset,
  seenAt,
  onLoad,
  requestSnapshot,
}: {
  feed: GroupedNotificationsFeed
  pageIndex: number
  headerOffset: number
  /**
   * Snapshot of when notifications were last seen, shared by every tab so
   * the unread tint doesn't change while the screen is open.
   */
  seenAt?: Date
  onLoad?: (load: PageLoad) => void
  /**
   * Asks the screen to take a new `seenAt` snapshot from this feed's next
   * load, before refreshing it.
   */
  requestSnapshot?: (feed: GroupedNotificationsFeed) => void
}) {
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const initialNumToRender = useInitialNumToRender()
  const trackPostView = usePostViewTracking('Notifications')
  const numUnread = useUnreadNotifications()
  const isScreenFocused = useIsFocused()
  const isActive = usePager().selectedPage === pageIndex
  const [isPTRing, setIsPTRing] = useState(false)

  // Don't fetch tabs until they've been opened
  const [hasBeenActive, setHasBeenActive] = useState(isActive)
  if (isActive && !hasBeenActive) {
    setHasBeenActive(true)
  }

  const {
    data,
    dataUpdatedAt,
    isFetched,
    isFetching,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useGroupedNotificationsQuery({feed, seenAt, enabled: hasBeenActive})

  const notifications = data?.pages.flatMap(page => page.notifications) ?? []

  const serverSeenAt = data?.pages[0]?.seenAt
  useEffect(() => {
    if (dataUpdatedAt > 0) {
      onLoad?.({feed, serverSeenAt, fetchedAt: dataUpdatedAt})
    }
  }, [feed, serverSeenAt, dataUpdatedAt, onLoad])

  const refresh = async () => {
    requestSnapshot?.(feed)
    await refreshGroupedNotifications(queryClient, feed)
  }

  // Coming back to the screen with new notifications loads them
  const onReturnToScreen = useEffectEvent(() => {
    if (isActive && hasBeenActive && numUnread !== '') {
      void refresh()
    }
  })
  const wasScreenFocused = useRef(isScreenFocused)
  useEffect(() => {
    if (isScreenFocused && !wasScreenFocused.current) {
      onReturnToScreen()
    }
    wasScreenFocused.current = isScreenFocused
  }, [isScreenFocused])

  let rows: Row[]
  if (!isFetched) {
    rows = [{type: 'loading', key: 'loading'}]
  } else if (notifications.length === 0) {
    rows = isError
      ? [{type: 'error', key: 'error'}]
      : [{type: 'empty', key: 'empty'}]
  } else {
    rows = buildRows(notifications)
    if (isError) {
      rows.push({type: 'loadMoreError', key: 'loadMoreError'})
    }
  }

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refresh()
    } catch (err) {
      logger.error('Failed to refresh grouped notifications', {
        safeMessage: err,
      })
    }
    setIsPTRing(false)
  }

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more grouped notifications', {
        safeMessage: err,
      })
    }
  }

  return (
    <MainScrollProvider>
      <List
        testID={`notificationsList-${feed}`}
        style={a.flex_1}
        headerOffset={headerOffset}
        {...(IS_WEB ? {disableFullWindowScroll: true} : {})}
        data={rows}
        keyExtractor={(row: Row) => row.key}
        renderItem={({item: row}: {item: Row}) => {
          switch (row.type) {
            case 'section':
              return <SectionHeader section={row.section} />
            case 'notification':
              return <NotificationItem notification={row.notification} />
            case 'loading':
              return <NotificationFeedLoadingPlaceholder />
            case 'empty':
              return (
                <EmptyState
                  icon={BellIcon}
                  message={getEmptyMessage(feed, l)}
                  style={[a.py_5xl]}
                />
              )
            case 'error':
              return (
                <ErrorMessage
                  message={cleanError(error)}
                  onPressTryAgain={() => void refetch()}
                />
              )
            case 'loadMoreError':
              return (
                <LoadMoreRetryBtn
                  label={l`There was an issue fetching notifications. Tap here to try again.`}
                  onPress={() => void fetchNextPage()}
                />
              )
          }
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={[a.pt_xl]}>
              <ActivityIndicator />
            </View>
          ) : undefined
        }
        refreshing={isPTRing}
        onRefresh={() => void onRefresh()}
        onEndReached={() => void onEndReached()}
        onEndReachedThreshold={2}
        onItemSeen={(row: Row) => {
          if (
            row.type === 'notification' &&
            (row.notification.type === 'reply' ||
              row.notification.type === 'mention' ||
              row.notification.type === 'quote')
          ) {
            trackPostView(row.notification.post)
          }
        }}
        contentContainerStyle={{paddingBottom: 200}}
        initialNumToRender={initialNumToRender}
        windowSize={11}
        sideBorders={false}
        removeClippedSubviews
      />
    </MainScrollProvider>
  )
}

/**
 * Splits notifications into "Today" and "Earlier". When nothing happened
 * today the headers are left out entirely, per the designs.
 */
function buildRows(notifications: NotificationView[]): Row[] {
  const rows: Row[] = []
  const hasToday = isToday(new Date(notifications[0].indexedAt))
  let addedEarlier = false

  if (hasToday) {
    rows.push({type: 'section', key: 'section-today', section: 'today'})
  }
  for (const notification of notifications) {
    if (
      hasToday &&
      !addedEarlier &&
      !isToday(new Date(notification.indexedAt))
    ) {
      rows.push({type: 'section', key: 'section-earlier', section: 'earlier'})
      addedEarlier = true
    }
    rows.push({
      type: 'notification',
      key: notification.id,
      notification,
    })
  }
  return rows
}

function SectionHeader({section}: {section: 'today' | 'earlier'}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.px_lg,
        section === 'today'
          ? a.py_sm
          : [a.border_t, a.pt_md, a.pb_sm, t.atoms.border_contrast_low],
      ]}>
      <Text accessibilityRole="header" style={[a.text_md, a.font_bold]}>
        {section === 'today'
          ? l({message: 'Today', context: 'Notifications section header'})
          : l({message: 'Earlier', context: 'Notifications section header'})}
      </Text>
    </View>
  )
}

function getEmptyMessage(
  feed: GroupedNotificationsFeed,
  l: ReturnType<typeof useLingui>['t'],
) {
  switch (feed) {
    case 'all':
      return l`No notifications yet`
    case 'people-i-follow':
      return l`No notifications from people you follow yet`
    case 'followers':
      return l`No followers to show yet`
    case 'conversations':
      return l`No replies to show yet`
    case 'activity':
      return l`No activity to show yet`
  }
}
