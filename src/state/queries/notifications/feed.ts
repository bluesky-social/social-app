/**
 * NOTE
 * The ./unread.ts API:
 *
 * - Provides a `checkUnread()` function to sync with the server,
 * - Periodically calls `checkUnread()`, and
 * - Caches the first page of notifications.
 *
 * IMPORTANT: This query uses ./unread.ts's cache as its first page,
 * IMPORTANT: which means the cache-freshness of this query is driven by the unread API.
 *
 * Follow these rules:
 *
 * 1. Call `checkUnread()` if you want to fetch latest in the background.
 * 2. Call `checkUnread({invalidate: true})` if you want latest to sync into this query's results immediately.
 * 3. Don't call this query's `refetch()` if you're trying to sync latest; call `checkUnread()` instead.
 */

import {useEffect, useRef} from 'react'
import {AppBskyFeedDefs} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {useMutedThreads} from '#/state/muted-threads'
import {useAgent} from '#/state/session'
import {useModerationOpts} from '../../preferences/moderation-opts'
import {STALE} from '..'
import {embedViewRecordToPostView, getEmbeddedPost} from '../util'
import {FeedPage} from './types'
import {useUnreadNotificationsApi} from './unread'
import {fetchPage} from './util'

export type {FeedNotification, FeedPage, NotificationType} from './types'

const PAGE_SIZE = 30

type RQPageParam = string | undefined

const RQKEY_ROOT = 'notification-feed'
export function RQKEY() {
  return [RQKEY_ROOT]
}

export function useNotificationFeedQuery(opts?: {enabled?: boolean}) {
  const {getAgent} = useAgent()
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()
  const threadMutes = useMutedThreads()
  const unreads = useUnreadNotificationsApi()
  const enabled = opts?.enabled !== false
  const lastPageCountRef = useRef(0)

  const query = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      let page
      if (!pageParam) {
        // for the first page, we check the cached page held by the unread-checker first
        page = unreads.getCachedUnreadPage()
      }
      if (!page) {
        page = (
          await fetchPage({
            getAgent,
            limit: PAGE_SIZE,
            cursor: pageParam,
            queryClient,
            moderationOpts,
            threadMutes,
            fetchAdditionalData: true,
          })
        ).page
      }

      // if the first page has an unread, mark all read
      if (!pageParam) {
        unreads.markAllRead()
      }

      return page
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
    select(data: InfiniteData<FeedPage>) {
      // override 'isRead' using the first page's returned seenAt
      // we do this because the `markAllRead()` call above will
      // mark subsequent pages as read prematurely
      const seenAt = data.pages[0]?.seenAt || new Date()
      for (const page of data.pages) {
        for (const item of page.items) {
          item.notification.isRead =
            seenAt > new Date(item.notification.indexedAt)
        }
      }

      return data
    },
  })

  useEffect(() => {
    const {isFetching, hasNextPage, data} = query
    if (isFetching || !hasNextPage) {
      return
    }

    // avoid double-fires of fetchNextPage()
    if (
      lastPageCountRef.current !== 0 &&
      lastPageCountRef.current === data?.pages?.length
    ) {
      return
    }

    // fetch next page if we haven't gotten a full page of content
    let count = 0
    for (const page of data?.pages || []) {
      count += page.items.length
    }
    if (count < PAGE_SIZE && (data?.pages.length || 0) < 6) {
      query.fetchNextPage()
      lastPageCountRef.current = data?.pages?.length || 0
    }
  }, [query])

  return query
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.items) {
        if (item.subject?.uri === uri) {
          yield item.subject
        }
        const quotedPost = getEmbeddedPost(item.subject?.embed)
        if (quotedPost?.uri === uri) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}
