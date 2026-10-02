import {useCallback, useMemo, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {type Client} from '@atproto/lex'
import {type AtIdentifierString, type AtUriString} from '@atproto/syntax'
import {
  moderatePost,
  type ModerationDecision,
  type ModerationOpts,
  type ModerationPrefs,
} from '@bsky/sdk/moderation'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {AuthorFeedAPI} from '#/lib/api/feed/author'
import {DemoFeedAPI} from '#/lib/api/feed/demo'
import {LikesFeedAPI} from '#/lib/api/feed/likes'
import {PostListFeedAPI} from '#/lib/api/feed/posts'
import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {
  type FeedPostNumbering,
  FeedTuner,
  type FeedViewPostsSlice,
} from '#/lib/api/feed-manip'
import {DISCOVER_FEED_URI} from '#/lib/constants'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useFeedTuners} from '#/state/preferences/feed-tuners'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {RQKEY_ROOT} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {useAutoPagination} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {KnownError} from '#/view/com/posts/PostFeedErrorMessage'
import {CustomFeedAPI} from '#/features/followingV2/home/api/custom'
import {FollowingFeedAPI} from '#/features/followingV2/home/api/following'
import {HomeFeedAPI} from '#/features/followingV2/home/api/home'
import {ListFeedAPI} from '#/features/followingV2/home/api/list'
import {
  type FeedAPI,
  type FeedSource,
  type ReasonFeedSource,
} from '#/features/followingV2/home/api/types'
import {type app} from '#/lexicons'

type ActorDid = string
export type AuthorFilter =
  | 'posts_with_replies'
  | 'posts_no_replies'
  | 'posts_and_author_threads'
  | 'posts_with_media'
  | 'posts_with_video'
type FeedUri = string
type ListUri = string
type PostsUriList = string

export type FeedDescriptor =
  | 'following'
  | `author|${ActorDid}|${AuthorFilter}`
  | `feedgen|${FeedUri}`
  | `likes|${ActorDid}`
  | `list|${ListUri}`
  | `posts|${PostsUriList}`
  | 'demo'
export interface FeedParams {
  feedCacheKey?: 'discover' | 'explore' | undefined
}

/** Everything needed to fetch the page after the one it follows. */
type RQPageParam = undefined | {cursor: string; source?: FeedSource}

/**
 * The fork's key prefixes the descriptor with `v2|`, so it never shares a
 * cache entry with the legacy feed, and legacy single-feed filters (another
 * screen refreshing or resetting the same feed) don't reach it. It keeps the
 * legacy root and the descriptor's text, so cache-wide operations still reach
 * it: post and profile shadows and the thread cache walk the root, label and
 * language changes reset or invalidate the root, and block changes match the
 * DID in `queryKey[1]`. The walkers read `pages[].feed`, so the fork's pages
 * must keep a `feed` of `FeedViewPost`s.
 */
export function RQKEY(feedDesc: FeedDescriptor, params?: FeedParams) {
  return [RQKEY_ROOT, `v2|${feedDesc}`, params || {}]
}

export interface FeedPostSliceItem {
  _reactKey: string
  uri: AtUriString
  post: app.bsky.feed.defs.PostView
  record: app.bsky.feed.post.Main
  postNumbering?: FeedPostNumbering
  moderation: ModerationDecision
  parentAuthor?: app.bsky.actor.defs.ProfileViewBasic
  isParentBlocked?: boolean
  isParentNotFound?: boolean
}

export interface FeedPostSlice {
  _isFeedPostSlice: boolean
  _reactKey: string
  items: FeedPostSliceItem[]
  isIncompleteThread: boolean
  isFallbackMarker: boolean
  feedContext: string | undefined
  reqId: string | undefined
  feedPostUri: string
  reason?:
    | app.bsky.feed.defs.ReasonRepost
    | app.bsky.feed.defs.ReasonPin
    | ReasonFeedSource
    | {[k: string]: unknown; $type: string}
}

export interface FeedPageUnselected {
  cursor: string | undefined
  /**
   * The server's cursor for the newest boundary of this page. Following pages
   * have one, once the appview supports it.
   */
  startCursor?: string
  /** See {@link FeedSource}. */
  source?: FeedSource
  feed: app.bsky.feed.defs.FeedViewPost[]
  fetchedAt: number
}

export interface FeedPage {
  tuner: FeedTuner
  cursor: string | undefined
  source?: FeedSource
  slices: FeedPostSlice[]
  fetchedAt: number
}

/**
 * The minimum number of posts we want in a single "page" of results. Since we
 * filter out unwanted content, we may fetch more than this number to ensure
 * that we get _at least_ this number.
 */
const MIN_POSTS = 30

export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
  opts?: {enabled?: boolean; ignoreFilterFor?: string},
) {
  const feedTuners = useFeedTuners(feedDesc)
  const moderationOpts = useModerationOpts()
  const {data: preferences} = usePreferencesQuery()
  /**
   * Load bearing: we need to await AA state or risk FOUC. This marginally
   * delays feeds, but AA state is fetched immediately on load and is then
   * available for the remainder of the session, so this delay only affects cold
   * loads. -esb
   */
  const enabled =
    opts?.enabled !== false && Boolean(moderationOpts) && Boolean(preferences)
  const {fetchPage} = usePostFeedFetcher(feedDesc)
  const lastRun = useRef<{
    data: InfiniteData<FeedPageUnselected>
    args: typeof selectArgs
    result: InfiniteData<FeedPage>
  } | null>(null)
  const isDiscover = feedDesc.includes(DISCOVER_FEED_URI)

  // Make sure this doesn't invalidate unless really needed.
  const selectArgs = useMemo(
    () => ({
      feedTuners,
      moderationOpts,
      ignoreFilterFor: opts?.ignoreFilterFor,
      isDiscover,
    }),
    [feedTuners, moderationOpts, opts?.ignoreFilterFor, isDiscover],
  )

  const query = useInfiniteQuery<
    FeedPageUnselected,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    enabled,
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(feedDesc, params),
    queryFn({pageParam}: {pageParam: RQPageParam}) {
      logger.debug('usePostFeedQuery', {feedDesc, cursor: pageParam?.cursor})
      return fetchPage(pageParam)
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage =>
      lastPage.cursor
        ? {
            cursor: lastPage.cursor,
            source: lastPage.source,
          }
        : undefined,
    select: useCallback(
      (data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
        // If the selection depends on some data, that data should
        // be included in the selectArgs object and read here.
        const {feedTuners, moderationOpts, ignoreFilterFor, isDiscover} =
          selectArgs

        const tuner = new FeedTuner(feedTuners)

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
              if (
                (selectArgs as Record<string, unknown>)[key] !==
                (lastArgs as Record<string, unknown>)[key]
              ) {
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
                // Keep the tuner in sync so that the end result is deterministic.
                tuner.tune(lastData.pages[i].feed)
                continue
              }
              // Stop as soon as pages stop matching up.
              break
            }
          }
        }

        const result = {
          pageParams: data.pageParams,
          pages: [
            ...reusedPages,
            ...data.pages.slice(reusedPages.length).map(page => ({
              tuner,
              cursor: page.cursor,
              source: page.source,
              fetchedAt: page.fetchedAt,
              slices: tuner
                .tune(page.feed)
                .map(slice =>
                  toFeedPostSlice(slice, {
                    moderationOpts: moderationOpts!,
                    ignoreFilterFor,
                    isDiscover,
                  }),
                )
                .filter(n => !!n),
            })),
          ],
        }
        // Save for memoization.
        lastRun.current = {data, result, args: selectArgs}
        return result
      },
      [selectArgs /* Don't change. Everything needs to go into selectArgs. */],
    ),
  })

  let itemCount = 0
  for (const page of query.data?.pages || []) {
    for (const slice of page.slices) {
      itemCount += slice.items.length
    }
  }
  useAutoPagination(query, itemCount, MIN_POSTS)

  return query
}

/**
 * A tuned slice as the feed renders it, moderated, or `undefined` if
 * moderation filters it out.
 */
export function toFeedPostSlice(
  slice: FeedViewPostsSlice,
  {
    moderationOpts,
    ignoreFilterFor,
    isDiscover = false,
  }: {
    moderationOpts: ModerationOpts
    ignoreFilterFor?: string
    isDiscover?: boolean
  },
): FeedPostSlice | undefined {
  const moderations = slice.items.map(item =>
    moderatePost(item.post, moderationOpts),
  )

  // apply moderation filter
  for (let i = 0; i < slice.items.length; i++) {
    const ignoreFilter = slice.items[i].post.author.did === ignoreFilterFor
    if (ignoreFilter) {
      // remove mutes to avoid confused UIs
      moderations[i].causes = moderations[i].causes.filter(
        cause => cause.type !== 'muted',
      )
    }
    if (!ignoreFilter && moderations[i]?.ui('contentList').filter) {
      return undefined
    }
  }

  if (isDiscover) {
    userActionHistory.seen(
      slice.items.map(item => ({
        feedContext: slice.feedContext,
        reqId: slice.reqId,
        likeCount: item.post.likeCount ?? 0,
        repostCount: item.post.repostCount ?? 0,
        replyCount: item.post.replyCount ?? 0,
        isFollowedBy: Boolean(item.post.author.viewer?.followedBy),
        uri: item.post.uri,
      })),
    )
  }

  const feedPostSlice: FeedPostSlice = {
    _reactKey: slice._reactKey,
    _isFeedPostSlice: true,
    isIncompleteThread: slice.isIncompleteThread,
    isFallbackMarker: slice.isFallbackMarker,
    feedContext: slice.feedContext,
    reqId: slice.reqId,
    reason: slice.reason,
    feedPostUri: slice.feedPostUri,
    items: slice.items.map((item, i) => {
      const feedPostSliceItem: FeedPostSliceItem = {
        _reactKey: `${slice._reactKey}-${i}-${item.post.uri}`,
        uri: item.post.uri,
        post: item.post,
        record: item.record,
        postNumbering: item.postNumbering,
        moderation: moderations[i],
        parentAuthor: item.parentAuthor,
        isParentBlocked: item.isParentBlocked,
        isParentNotFound: item.isParentNotFound,
      }
      return feedPostSliceItem
    }),
  }
  return feedPostSlice
}

/**
 * Fetches pages of this feed, for the query and for the view's own fetches
 * outside of it. Each fetch gets a fresh feed API, as they hold no state
 * between pages.
 */
export function usePostFeedFetcher(feedDesc: FeedDescriptor) {
  const {data: preferences} = usePreferencesQuery()
  const userInterests = aggregateUserInterests(preferences)
  const followingPinnedIndex =
    preferences?.savedFeeds?.findIndex(
      f => f.pinned && f.value === 'following',
    ) ?? -1
  const enableFollowingToDiscoverFallback = followingPinnedIndex === 0
  const {hasSession} = useSession()
  const client = useAppviewClient()

  /**
   * The number of posts to fetch in a single request. Because we filter
   * unwanted content, we may over-fetch here to try and fill pages by
   * `MIN_POSTS`. But if you're doing this, ask @why if it's ok first.
   */
  const fetchLimit = MIN_POSTS

  const createFeedApi = () =>
    createApi({
      feedDesc,
      client,
      // Not in the query key because they don't change:
      userInterests,
      // Not in the query key. Reacting to it switching isn't important:
      enableFollowingToDiscoverFallback,
    })

  const fetchPage = async (
    pageParam: RQPageParam,
  ): Promise<FeedPageUnselected> => {
    const api = createFeedApi()
    const res = await api.fetch({
      cursor: pageParam?.cursor,
      source: pageParam?.source,
      limit: fetchLimit,
    })

    /*
     * If this is a public view, we need to check if posts fail moderation.
     * If all fail, we throw an error. If only some fail, we continue and let
     * moderations happen later, which results in some posts being shown and
     * some not.
     */
    if (!hasSession) {
      assertSomePostsPassModeration(
        res.feed,
        preferences?.moderationPrefs ||
          DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
      )
    }

    return {
      cursor: res.cursor,
      startCursor: res.startCursor,
      source: res.source,
      feed: res.feed,
      fetchedAt: Date.now(),
    }
  }

  return {createFeedApi, fetchPage}
}

export type PostFeedData = InfiniteData<FeedPageUnselected, RQPageParam>

/**
 * Refreshes the feed from the top with one fetch and then one write, so the
 * new top renders once and a failed refresh leaves the feed as it was. `error`
 * is why the last refresh failed, cleared when another starts. Refetches from
 * an invalidation or a reset still go through TanStack.
 *
 * One started while another is pending joins it. One that finishes after the
 * view has gone still commits, which is safe, as the commit gives way to
 * anything that has replaced the top page since.
 */
export function usePostFeedRefresh(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
) {
  const queryClient = useQueryClient()
  const {fetchPage} = usePostFeedFetcher(feedDesc)
  const queryKey = RQKEY(feedDesc, params)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  /** The pending refresh, for another to join. */
  const pending = useRef<Promise<void>>(undefined)

  const refreshFromTop = async () => {
    const before = queryClient.getQueryData<PostFeedData>(queryKey)
    setError(undefined)
    setIsRefreshing(true)
    try {
      const page = await fetchPage(undefined)
      await commit(queryClient, queryKey, before, {
        pages: [page],
        pageParams: [undefined],
      })
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to refresh posts feed', {safeMessage: e})
      }
      // Nothing to report once the feed has moved on.
      if (!isTopReplaced(queryClient, queryKey, before)) {
        setError(e instanceof Error ? e : new Error(String(e)))
      }
    } finally {
      pending.current = undefined
      setIsRefreshing(false)
    }
  }

  const refresh = () => {
    /*
     * Until the first load settles there's nothing to refresh, and the query
     * may still be waiting for the preferences it fetches with.
     */
    const status = queryClient.getQueryState(queryKey)?.status
    if (!status || status === 'pending') {
      return Promise.resolve()
    }
    pending.current ??= refreshFromTop()
    return pending.current
  }

  return {refresh, error, isRefreshing}
}

/** Whether something else has replaced the feed's top page since `before`. */
function isTopReplaced(
  queryClient: QueryClient,
  queryKey: QueryKey,
  before: PostFeedData | undefined,
) {
  return (
    queryClient.getQueryData<PostFeedData>(queryKey)?.pages[0] !==
    before?.pages[0]
  )
}

/**
 * Writes `data` over the feed's, unless something else has replaced its top
 * page since `before` was read (a refetch, a reset or a removal) or is
 * fetching it now.
 */
async function commit(
  queryClient: QueryClient,
  queryKey: QueryKey,
  before: PostFeedData | undefined,
  data: PostFeedData,
) {
  const state = queryClient.getQueryState(queryKey)
  // A fetch from the top in flight will land after this write, so it wins.
  const isFetchingTop =
    state?.fetchStatus !== 'idle' && !state?.fetchMeta?.fetchMore
  if (isTopReplaced(queryClient, queryKey, before) || isFetchingTop) {
    return
  }
  /*
   * A fetchNextPage in flight would land after this write and put back the
   * pages it replaces, so it's cancelled. Cancelling reverts its state at
   * once, and waiting for it lets one that had already resolved write first.
   * Anything fetching after that started since, from the data being replaced.
   */
  await queryClient.cancelQueries({queryKey, exact: true})
  if (
    isTopReplaced(queryClient, queryKey, before) ||
    queryClient.getQueryState(queryKey)?.fetchStatus !== 'idle'
  ) {
    return
  }
  queryClient.setQueryData<PostFeedData>(queryKey, data)
}

/**
 * Whether the feed has a newer post than its top `page` has seen. `api` should
 * be a fresh one from {@link usePostFeedFetcher}.
 */
export async function pollLatest(page: FeedPage | undefined, api: FeedAPI) {
  if (!page) {
    return false
  }
  if (AppState.currentState !== 'active') {
    return
  }

  logger.debug('usePostFeedQuery: pollLatest')
  const post = await api.peekLatest({source: page.source})
  if (post) {
    const slices = page.tuner.tune([post], {
      dryRun: true,
    })
    if (slices[0]) {
      return true
    }
  }

  return false
}

function createApi({
  feedDesc,
  userInterests,
  client,
  enableFollowingToDiscoverFallback,
}: {
  feedDesc: FeedDescriptor
  userInterests?: string
  client: Client
  enableFollowingToDiscoverFallback: boolean
}): FeedAPI {
  if (feedDesc === 'following') {
    if (enableFollowingToDiscoverFallback) {
      return new HomeFeedAPI({client, userInterests})
    } else {
      return new FollowingFeedAPI({client})
    }
  } else if (feedDesc.startsWith('author')) {
    const [__, actor, filter] = feedDesc.split('|')
    /*
     * The descriptor is split out of an internally-built string, so neither the
     * actor identifier nor the filter token is narrowed by the compiler here.
     */
    return new AuthorFeedAPI({
      client,
      feedParams: {actor: actor as AtIdentifierString, filter},
    })
  } else if (feedDesc.startsWith('likes')) {
    const [__, actor] = feedDesc.split('|')
    return new LikesFeedAPI({
      client,
      feedParams: {actor: actor as AtIdentifierString},
    })
  } else if (feedDesc.startsWith('feedgen')) {
    const [__, feed] = feedDesc.split('|')
    return new CustomFeedAPI({
      client,
      feedParams: {feed: feed as AtUriString},
      userInterests,
    })
  } else if (feedDesc.startsWith('list')) {
    const [__, list] = feedDesc.split('|')
    return new ListFeedAPI({client, feedParams: {list: list as AtUriString}})
  } else if (feedDesc.startsWith('posts')) {
    const [__, uriList] = feedDesc.split('|')
    return new PostListFeedAPI({
      client,
      feedParams: {uris: uriList.split(',') as AtUriString[]},
    })
  } else if (feedDesc === 'demo') {
    return new DemoFeedAPI({client})
  } else {
    // shouldnt happen
    return new FollowingFeedAPI({client})
  }
}

function assertSomePostsPassModeration(
  feed: app.bsky.feed.defs.FeedViewPost[],
  moderationPrefs: ModerationPrefs,
) {
  // no posts in this feed
  if (feed.length === 0) return true

  // assume false
  let somePostsPassModeration = false

  for (const item of feed) {
    const moderation = moderatePost(item.post, {
      userDid: undefined,
      prefs: moderationPrefs,
    })

    if (!moderation.ui('contentList').filter) {
      // we have a sfw post
      somePostsPassModeration = true
    }
  }

  if (!somePostsPassModeration) {
    throw new Error(KnownError.FeedSignedInOnly)
  }
}
