import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import {useUnreadNotificationsApi} from './unread'

const PAGE_SIZE = 30

export type GroupedNotificationsFilter =
  'all' | 'people-i-follow' | 'conversations' | 'followers' | 'activity'

type Page = app.bsky.notification.getGroupedNotifications.$OutputBody
type PageParam = string | undefined

const groupedNotificationsQueryKeyRoot = 'grouped-notifications'
export const groupedNotificationsQueryKey = ({
  filter,
  utcOffset,
}: {
  filter: GroupedNotificationsFilter
  utcOffset: number
}) => createQueryKey(groupedNotificationsQueryKeyRoot, {filter, utcOffset})

export function useGroupedNotificationsQuery({
  enabled = true,
  filter,
}: {
  enabled?: boolean
  filter: GroupedNotificationsFilter
}) {
  const client = useAppviewClient()
  const unreads = useUnreadNotificationsApi()
  const utcOffset = -new Date().getTimezoneOffset()

  return useInfiniteQuery<Page, Error, InfiniteData<Page>, QueryKey, PageParam>(
    {
      staleTime: STALE.MINUTES.ONE,
      queryKey: groupedNotificationsQueryKey({filter, utcOffset}),
      async queryFn({pageParam}) {
        const page = await client.call(
          app.bsky.notification.getGroupedNotifications,
          {
            filter,
            utcOffset,
            limit: PAGE_SIZE,
            cursor: pageParam,
          },
        )
        if (filter === 'all' && !pageParam) {
          void unreads.markAllRead()
        }
        return page
      },
      initialPageParam: undefined,
      getNextPageParam: page => page.cursor,
      enabled,
    },
  )
}
