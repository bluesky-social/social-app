import {ActivityIndicator, type ListRenderItemInfo, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {
  type GroupedNotificationsFilter,
  useGroupedNotificationsQuery,
} from '#/state/queries/notifications/grouped'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {NotificationFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {GroupedNotificationItem} from '#/screens/Notifications/components/GroupedNotificationItem'
import {type GroupedNotification} from '#/screens/Notifications/components/GroupedNotificationItem/types'
import {atoms as a, useTheme} from '#/alf'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {IS_WEB} from '#/env'
import {type app} from '#/lexicons'
import * as NotificationItem from './NotificationItem'

type DateDivider = {
  type: 'date-divider'
  id: 'today' | 'earlier'
}

type PageListItem = GroupedNotification | DateDivider
type ResponseGroup =
  app.bsky.notification.getGroupedNotifications.$OutputBody['groups'][number]

const GROUPED_NOTIFICATION_TYPES = new Set<GroupedNotification['$type']>([
  'app.bsky.notification.getGroupedNotifications#likeGroup',
  'app.bsky.notification.getGroupedNotifications#multiPostLikeGroup',
  'app.bsky.notification.getGroupedNotifications#repostGroup',
  'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup',
  'app.bsky.notification.getGroupedNotifications#repostViaRepostGroup',
  'app.bsky.notification.getGroupedNotifications#followGroup',
  'app.bsky.notification.getGroupedNotifications#subscribedPostGroup',
  'app.bsky.notification.getGroupedNotifications#generatorLikeGroup',
  'app.bsky.notification.getGroupedNotifications#replyNotification',
  'app.bsky.notification.getGroupedNotifications#quoteNotification',
  'app.bsky.notification.getGroupedNotifications#mentionNotification',
  'app.bsky.notification.getGroupedNotifications#followBackNotification',
  'app.bsky.notification.getGroupedNotifications#verifiedNotification',
  'app.bsky.notification.getGroupedNotifications#unverifiedNotification',
  'app.bsky.notification.getGroupedNotifications#starterPackJoinedNotification',
  'app.bsky.notification.getGroupedNotifications#contactMatchNotification',
])

function isGroupedNotification(
  notification: ResponseGroup,
): notification is GroupedNotification {
  return GROUPED_NOTIFICATION_TYPES.has(
    notification.$type as GroupedNotification['$type'],
  )
}

function isDateDivider(item: PageListItem): item is DateDivider {
  return 'type' in item && item.type === 'date-divider'
}

function addDateDividers(notifications: GroupedNotification[]): PageListItem[] {
  const today = new Date().toDateString()
  const sorted = [...notifications].sort(
    (a, b) => Date.parse(b.indexedAt) - Date.parse(a.indexedAt),
  )
  const todayNotifications = sorted.filter(
    notification => new Date(notification.indexedAt).toDateString() === today,
  )
  const earlierNotifications = sorted.filter(
    notification => new Date(notification.indexedAt).toDateString() !== today,
  )

  return [
    ...(todayNotifications.length
      ? [{type: 'date-divider', id: 'today'} as const, ...todayNotifications]
      : []),
    ...(earlierNotifications.length
      ? [
          {type: 'date-divider', id: 'earlier'} as const,
          ...earlierNotifications,
        ]
      : []),
  ]
}

export function PageList({
  demoItems,
  filter,
  headerOffset,
}: {
  demoItems?: GroupedNotification[]
  filter: GroupedNotificationsFilter
  headerOffset: number
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const query = useGroupedNotificationsQuery({
    enabled: !demoItems,
    filter,
  })
  const seenAt = query.data?.pages[0]?.seenAt
  const notifications = demoItems
    ? demoItems
    : (query.data?.pages.flatMap(page => page.groups) ?? [])
        .filter(isGroupedNotification)
        .map(notification =>
          seenAt
            ? {
                ...notification,
                isRead: Date.parse(notification.indexedAt) < Date.parse(seenAt),
              }
            : notification,
        )
  const items = addDateDividers(notifications)
  const isInitialError = query.isError && items.length === 0

  const onEndReached = () => {
    if (
      demoItems ||
      query.isFetching ||
      !query.hasNextPage ||
      query.isFetchNextPageError
    ) {
      return
    }
    void query.fetchNextPage()
  }

  return (
    <MainScrollProvider>
      <List
        style={a.flex_1}
        headerOffset={headerOffset}
        {...(IS_WEB ? {disableFullWindowScroll: true} : {})}
        data={items}
        keyExtractor={(item: PageListItem) =>
          isDateDivider(item) ? `date-divider-${item.id}` : item.id
        }
        renderItem={({item}: ListRenderItemInfo<PageListItem>) =>
          isDateDivider(item) ? (
            <NotificationItem.SectionHeader>
              <NotificationItem.SectionHeaderText>
                {item.id === 'today' ? (
                  <Trans>Today</Trans>
                ) : (
                  <Trans>Earlier</Trans>
                )}
              </NotificationItem.SectionHeaderText>
            </NotificationItem.SectionHeader>
          ) : (
            <GroupedNotificationItem notification={item} />
          )
        }
        ItemSeparatorComponent={() => (
          <View style={[a.border_b, t.atoms.border_contrast_low]} />
        )}
        ListEmptyComponent={
          isInitialError ? (
            <ErrorMessage
              message={cleanError(query.error)}
              onPressTryAgain={() => void query.refetch()}
            />
          ) : !demoItems && query.isPending ? (
            <NotificationFeedLoadingPlaceholder />
          ) : (
            <EmptyState
              icon={BellIcon}
              message={l`No notifications yet!`}
              style={[a.py_5xl]}
            />
          )
        }
        ListFooterComponent={
          query.isFetchNextPageError ? (
            <LoadMoreRetryBtn
              label={l`There was an issue fetching notifications. Tap here to try again.`}
              onPress={() => void query.fetchNextPage()}
            />
          ) : query.isFetchingNextPage ? (
            <View style={[a.py_xl]}>
              <ActivityIndicator />
            </View>
          ) : undefined
        }
        refreshing={
          !demoItems && query.isRefetching && !query.isFetchingNextPage
        }
        onRefresh={demoItems ? undefined : () => void query.refetch()}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
      />
    </MainScrollProvider>
  )
}
