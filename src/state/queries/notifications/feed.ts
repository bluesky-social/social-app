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

import {useCallback, useEffect, useMemo, useRef} from 'react'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {useAgent} from '#/state/session'
import {useThreadgateHiddenReplyUris} from '#/state/threadgate-hidden-replies'
import {useModerationOpts} from '../../preferences/moderation-opts'
import {STALE} from '..'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from '../util'
import {FeedPage} from './types'
import {useUnreadNotificationsApi} from './unread'
import {fetchPage} from './util'

export type {FeedNotification, FeedPage, NotificationType} from './types'

const PAGE_SIZE = 30

type RQPageParam = string | undefined

const RQKEY_ROOT = 'notification-feed'
export function RQKEY(priority?: false) {
  return [RQKEY_ROOT, priority]
}

export function useNotificationFeedQuery(opts?: {
  enabled?: boolean
  overridePriorityNotifications?: boolean
}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()
  const unreads = useUnreadNotificationsApi()
  const enabled = opts?.enabled !== false
  const {uris: hiddenReplyUris} = useThreadgateHiddenReplyUris()

  // false: force showing all notifications
  // undefined: let the server decide
  const priority = opts?.overridePriorityNotifications ? false : undefined

  const selectArgs = useMemo(() => {
    return {
      moderationOpts,
      hiddenReplyUris,
    }
  }, [moderationOpts, hiddenReplyUris])
  const lastRun = useRef<{
    data: InfiniteData<FeedPage>
    args: typeof selectArgs
    result: InfiniteData<FeedPage>
  } | null>(null)

  const query = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(priority),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      let page
      if (!pageParam) {
        // for the first page, we check the cached page held by the unread-checker first
        page = unreads.getCachedUnreadPage()
      }
      if (!page) {
        const {page: fetchedPage} = await fetchPage({
          agent,
          limit: PAGE_SIZE,
          cursor: pageParam,
          queryClient,
          moderationOpts,
          fetchAdditionalData: true,
          priority,
        })
        page = fetchedPage
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
    select: useCallback(
      (data: InfiniteData<FeedPage>) => {
        const {moderationOpts, hiddenReplyUris} = selectArgs

        // Keep track of the last run and whether we can reuse
        // some already selected pages from there.
        let reusedPages = []
        if (lastRun.current) {
          const {
            data: lastData,
            args: lastArgs,
            result: lastResult,
          } = lastRun.current
          let canReuse = true
          for (let key in selectArgs) {
            if (selectArgs.hasOwnProperty(key)) {
              if ((selectArgs as any)[key] !== (lastArgs as any)[key]) {
                // Can't do reuse anything if any input has changed.
                canReuse = false
                break
              }
            }
          }
          if (canReuse) {
            for (let i = 0; i < data.pages.length; i++) {
              if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                reusedPages.push(lastResult.pages[i])
                continue
              }
              // Stop as soon as pages stop matching up.
              break
            }
          }
        }

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

        const result = {
          ...data,
          pages: [
            ...reusedPages,
            ...data.pages.slice(reusedPages.length).map(page => {
              return {
                ...page,
                items: page.items
                  .filter(item => {
                    const isHiddenReply =
                      item.type === 'reply' &&
                      item.subjectUri &&
                      hiddenReplyUris.has(item.subjectUri)
                    return !isHiddenReply
                  })
                  .filter(item => {
                    if (
                      item.type === 'reply' ||
                      item.type === 'mention' ||
                      item.type === 'quote'
                    ) {
                      /*
                       * The `isPostView` check will fail here bc we don't have
                       * a `$type` field on the `subject`. But if the nested
                       * `record` is a post, we know it's a post view.
                       */
                      if (AppBskyFeedPost.isRecord(item.subject?.record)) {
                        const mod = moderatePost(item.subject, moderationOpts!)
                        if (mod.ui('contentList').filter) {
                          return false
                        }
                      }
                    }
                    return true
                  }),
              }
            }),
          ],
        }

        lastRun.current = {data, result, args: selectArgs}

        return result
      },
      [selectArgs],
    ),
  })

  // The server may end up returning an empty page, a page with too few items,
  // or a page with items that end up getting filtered out. When we fetch pages,
  // we'll keep track of how many items we actually hope to see. If the server
  // doesn't return enough items, we're going to continue asking for more items.
  const lastItemCount = useRef(0)
  const wantedItemCount = useRef(0)
  const autoPaginationAttemptCount = useRef(0)
  useEffect(() => {
    const {data, isLoading, isRefetching, isFetchingNextPage, hasNextPage} =
      query
    // Count the items that we already have.
    let itemCount = 0
    for (const page of data?.pages || []) {
      itemCount += page.items.length
    }

    // If items got truncated, reset the state we're tracking below.
    if (itemCount !== lastItemCount.current) {
      if (itemCount < lastItemCount.current) {
        wantedItemCount.current = itemCount
      }
      lastItemCount.current = itemCount
    }

    // Now track how many items we really want, and fetch more if needed.
    if (isLoading || isRefetching) {
      // During the initial fetch, we want to get an entire page's worth of items.
      wantedItemCount.current = PAGE_SIZE
    } else if (isFetchingNextPage) {
      if (itemCount > wantedItemCount.current) {
        // We have more items than wantedItemCount, so wantedItemCount must be out of date.
        // Some other code must have called fetchNextPage(), for example, from onEndReached.
        // Adjust the wantedItemCount to reflect that we want one more full page of items.
        wantedItemCount.current = itemCount + PAGE_SIZE
      }
    } else if (hasNextPage) {
      // At this point we're not fetching anymore, so it's time to make a decision.
      // If we didn't receive enough items from the server, paginate again until we do.
      if (itemCount < wantedItemCount.current) {
        autoPaginationAttemptCount.current++
        if (autoPaginationAttemptCount.current < 50 /* failsafe */) {
          query.fetchNextPage()
        }
      } else {
        autoPaginationAttemptCount.current = 0
      }
    }
  }, [query])

  return query
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }

    for (const page of queryData?.pages) {
      for (const item of page.items) {
        if (item.type !== 'starterpack-joined') {
          if (item.subject && didOrHandleUriMatches(atUri, item.subject)) {
            yield item.subject
          }
        }

        const quotedPost = getEmbeddedPost(item.subject?.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost!)
        }
      }
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.items) {
        if (
          item.type !== 'starterpack-joined' &&
          item.subject?.author.did === did
        ) {
          yield item.subject.author
        }
        const quotedPost = getEmbeddedPost(item.subject?.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
      }
    }
  }
}
