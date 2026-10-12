import {AtUri} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {
  createFollowActorsPage,
  type FollowActorsPage,
  getNextActorDids,
  getUnresolvedActorDids,
  selectLoadedActors,
} from '#/state/queries/notifications/grouped/follow-actors'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {
  moderateNotification,
  type NotificationModerationArgs,
} from '#/state/queries/notifications/grouped/moderate'
import {
  type GroupedNotificationsFeed,
  type GroupedNotificationsPage,
  type NotificationView,
} from '#/state/queries/notifications/grouped/types'
import {
  createQueryKey,
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
  useAutoPagination,
} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {useThreadgateHiddenReplyUris} from '#/state/threadgate-hidden-replies'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

export type {
  GroupedNotificationsFeed,
  GroupedNotificationsPage,
  NotificationView,
  NotificationViewType,
  ParentPost,
} from '#/state/queries/notifications/grouped/types'

type ProfileView = app.bsky.actor.defs.ProfileViewDetailed
type PostView = app.bsky.feed.defs.PostView

const PAGE_SIZE = 30

const groupedNotificationsQueryKeyRoot = 'grouped-notifications'

export const createGroupedNotificationsQueryKey = (args: {
  feed: GroupedNotificationsFeed
}) => createQueryKey(groupedNotificationsQueryKeyRoot, args)

/**
 * A page as the query caches it.
 */
export type LoadedGroupedNotificationsPage = GroupedNotificationsPage & {
  /**
   * When the page was requested, in ms since the epoch.
   */
  requestedAt: number
}

/**
 * Drops all but the first page of a feed and refetches it, so a refresh is a
 * single request. Resolves once the refetch settles, successfully or not.
 *
 * A feed that's loaded but not on screen is refetched too, e.g. a tab that
 * web keeps hidden, but one that was never opened is left alone.
 */
export async function refreshGroupedNotifications(
  queryClient: QueryClient,
  feed: GroupedNotificationsFeed,
) {
  const queryKey = createGroupedNotificationsQueryKey({feed})
  queryClient.setQueryData<
    InfiniteData<LoadedGroupedNotificationsPage, string | undefined>
  >(queryKey, data =>
    data
      ? {
          pageParams: data.pageParams.slice(0, 1),
          pages: data.pages.slice(0, 1),
        }
      : data,
  )
  await queryClient.invalidateQueries({queryKey, refetchType: 'all'})
}

/**
 * The first page of a feed as loaded, read straight from the cache.
 */
export function getGroupedNotificationsTop(
  queryClient: QueryClient,
  feed: GroupedNotificationsFeed,
): LoadedGroupedNotificationsPage | undefined {
  return queryClient.getQueryData<
    InfiniteData<LoadedGroupedNotificationsPage, string | undefined>
  >(createGroupedNotificationsQueryKey({feed}))?.pages[0]
}

/**
 * Pages of `app.bsky.notification.getGroupedNotifications`, hydrated against
 * each page's `relatedViews` and moderated.
 *
 * Never goes stale on its own; the screen decides when to refresh.
 */
export function useGroupedNotificationsQuery({
  feed,
  enabled = true,
  seenAt,
}: {
  feed: GroupedNotificationsFeed
  enabled?: boolean
  /**
   * When set, overrides each notification's `isRead` with
   * `indexedAt <= seenAt`. Useful when the screen has marked everything read
   * but wants to keep showing what was new when it opened.
   */
  seenAt?: Date
}) {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const {uris: hiddenReplyUris} = useThreadgateHiddenReplyUris()
  const viewerDid = currentAccount?.did
  /*
   * Compare by time rather than identity, so a caller passing a fresh `Date`
   * each render doesn't invalidate the select cache.
   */
  const seenAtMs = seenAt?.getTime()

  const query = useInfiniteQuery({
    // Wait for moderation, so unmoderated rows never flash up
    enabled: enabled && !!moderationOpts,
    staleTime: STALE.INFINITY,
    queryKey: createGroupedNotificationsQueryKey({feed}),
    async queryFn({pageParam}): Promise<LoadedGroupedNotificationsPage> {
      const requestedAt = Date.now()
      const res = await client.call(
        app.bsky.notification.getGroupedNotifications,
        {
          feed,
          limit: PAGE_SIZE,
          cursor: pageParam,
        },
      )
      return {...hydratePage(res, {viewerDid}), requestedAt}
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    select(data) {
      return selectNotifications(data, {
        moderationOpts,
        hiddenReplyUris,
        seenAtMs,
      })
    },
  })

  const itemCount =
    query.data?.pages.reduce(
      (count, page) => count + page.notifications.length,
      0,
    ) ?? 0
  useAutoPagination(query, itemCount, PAGE_SIZE)

  return query
}

type SelectArgs = NotificationModerationArgs & {
  seenAtMs: number | undefined
}

/**
 * Per-page select results, keyed by the cached page. Pages are immutable once
 * fetched, so only new pages (or changed args) need moderating again, as in
 * the legacy notifications query.
 */
const selectCache = new WeakMap<
  GroupedNotificationsPage,
  {args: SelectArgs; notifications: NotificationView[]}
>()

function selectNotifications(
  data: InfiniteData<LoadedGroupedNotificationsPage, string | undefined>,
  args: SelectArgs,
): InfiniteData<LoadedGroupedNotificationsPage, string | undefined> {
  const seenIds = new Set<string>()
  return {
    ...data,
    pages: data.pages.map(page => {
      let cached = selectCache.get(page)
      if (
        !cached ||
        cached.args.moderationOpts !== args.moderationOpts ||
        cached.args.hiddenReplyUris !== args.hiddenReplyUris ||
        cached.args.seenAtMs !== args.seenAtMs
      ) {
        cached = {
          args,
          notifications: page.notifications.flatMap(notification => {
            const selected = selectNotification(notification, args)
            return selected ? [selected] : []
          }),
        }
        selectCache.set(page, cached)
      }
      return {
        ...page,
        // Pages can overlap if new notifications arrive while paginating.
        notifications: cached.notifications.filter(notification => {
          if (seenIds.has(notification.id)) return false
          seenIds.add(notification.id)
          return true
        }),
      }
    }),
  }
}

/**
 * Applies moderation and the `isRead` override to one notification. Returns
 * the same object when nothing changes, a new wrapper when something does,
 * or `undefined` to drop it. Views are never copied.
 */
function selectNotification(
  notification: NotificationView,
  args: SelectArgs,
): NotificationView | undefined {
  const moderated = moderateNotification(notification, args)
  if (!moderated || args.seenAtMs === undefined) return moderated
  const isRead = new Date(moderated.indexedAt).getTime() <= args.seenAtMs
  return isRead === moderated.isRead ? moderated : {...moderated, isRead}
}

const followActorsQueryKeyRoot = 'follow-actors'

export const createFollowActorsQueryKey = (args: {notificationId: string}) =>
  createQueryKey(followActorsQueryKeyRoot, args)

/**
 * The followers in a grouped follow notification beyond the profiles it
 * resolved, loaded a page at a time with `app.bsky.actor.getProfiles` for
 * "Show more". Nothing loads until `fetchNextPage` is called, and loaded
 * pages are kept rather than refetched.
 *
 * Returns the loaded `actors` to show, moderated as the notification's own
 * actors are, and whether any followers are left to request (`hasMore`).
 */
export function useFollowActorsQuery({
  notification,
}: {
  notification: Extract<NotificationView, {type: 'follow'}>
}) {
  const client = useAppviewClient()
  const moderationOpts = useModerationOpts()
  const unresolvedDids = getUnresolvedActorDids(notification)

  const {data, isFetching, fetchNextPage} = useInfiniteQuery({
    // Even the first page waits for `fetchNextPage`
    enabled: false,
    staleTime: STALE.INFINITY,
    queryKey: createFollowActorsQueryKey({notificationId: notification.id}),
    async queryFn({pageParam}): Promise<FollowActorsPage> {
      const res = await client.call(app.bsky.actor.getProfiles, {
        actors: pageParam,
      })
      return createFollowActorsPage(pageParam, res.profiles)
    },
    initialPageParam: getNextActorDids(unresolvedDids, []),
    getNextPageParam(_lastPage, pages) {
      const dids = getNextActorDids(unresolvedDids, pages)
      return dids.length > 0 ? dids : undefined
    },
  })

  const pages = data?.pages ?? []
  return {
    actors: selectLoadedActors(pages, unresolvedDids, moderationOpts),
    hasMore: getNextActorDids(unresolvedDids, pages).length > 0,
    isFetching,
    fetchNextPage,
  }
}

/**
 * Every post a notification holds, for the shadow and thread caches.
 */
function* postsInNotification(
  notification: NotificationView,
): Generator<PostView, void> {
  switch (notification.type) {
    case 'like':
    case 'repost':
    case 'likeViaRepost':
    case 'repostViaRepost':
      yield notification.post
      break
    case 'reply':
    case 'quote':
    case 'mention':
      yield notification.post
      if (notification.parent?.type === 'post') {
        yield notification.parent.post
      }
      break
    case 'multiPostLike':
      yield* notification.posts
      break
    case 'subscribedPost':
      for (const item of notification.items) {
        yield item.post
      }
      break
  }
}

/**
 * Every actor a notification holds, excluding post authors.
 */
function* actorsInNotification(
  notification: NotificationView,
): Generator<ProfileView, void> {
  switch (notification.type) {
    case 'like':
    case 'repost':
    case 'likeViaRepost':
    case 'repostViaRepost':
    case 'follow':
    case 'generatorLike':
      yield* notification.actors
      break
    case 'multiPostLike':
    case 'followBack':
    case 'verified':
    case 'unverified':
    case 'starterPackJoined':
    case 'contactMatch':
      yield notification.actor
      break
    case 'subscribedPost':
      for (const item of notification.items) {
        yield item.actor
      }
      break
  }
}

function* cachedNotifications(
  queryClient: QueryClient,
): Generator<NotificationView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<GroupedNotificationsPage>
  >({queryKey: [groupedNotificationsQueryKeyRoot]})
  for (const [_queryKey, queryData] of queryDatas) {
    for (const page of queryData?.pages ?? []) {
      yield* page.notifications
    }
  }
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<PostView, void> {
  const atUri = new AtUri(uri)
  for (const notification of cachedNotifications(queryClient)) {
    for (const post of postsInNotification(notification)) {
      if (didOrHandleUriMatches(atUri, post)) {
        yield post
      }
      const quotedPost = getEmbeddedPost(post.embed)
      if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
        yield embedViewRecordToPostView(quotedPost)
      }
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  for (const notification of cachedNotifications(queryClient)) {
    for (const actor of actorsInNotification(notification)) {
      if (actor.did === did) {
        yield actor
      }
    }
    for (const post of postsInNotification(notification)) {
      if (post.author.did === did) {
        yield post.author
      }
      const quotedPost = getEmbeddedPost(post.embed)
      if (quotedPost?.author.did === did) {
        yield quotedPost.author
      }
    }
  }
  // Followers loaded by "Show more", so their follow buttons update too
  const followActorsDatas = queryClient.getQueriesData<
    InfiniteData<FollowActorsPage>
  >({queryKey: [followActorsQueryKeyRoot]})
  for (const [_queryKey, queryData] of followActorsDatas) {
    for (const page of queryData?.pages ?? []) {
      for (const profile of page.profiles) {
        if (profile.did === did) {
          yield profile
        }
      }
    }
  }
}
