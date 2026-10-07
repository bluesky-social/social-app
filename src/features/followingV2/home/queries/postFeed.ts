import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  /**
   * The `since` the page was requested with, on a page put above the others
   * (see {@link usePostFeedPrepend}). The server echoes it as the cursor
   * when the range it bounds is exhausted, so the page sits right on the one
   * below. Any other cursor leaves a gap between them (see {@link gapBelow}).
   */
  since?: string
  /** See {@link FeedSource}. */
  source?: FeedSource
  feed: app.bsky.feed.defs.FeedViewPost[]
  fetchedAt: number
}

export interface FeedPage {
  tuner: FeedTuner
  cursor: string | undefined
  /** See {@link FeedPageUnselected}. */
  startCursor?: string
  /** See {@link FeedPageUnselected}. */
  since?: string
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
    args: typeof selectArgs
    /** The pages it tuned, in the order it tuned them. */
    tuned: {page: FeedPageUnselected; selected: FeedPage}[]
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
    InfiniteData<FeedPage> | undefined,
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
        /*
         * Data restored from disk is here before the query is enabled, so it
         * can be here before what moderates it is. Until that's ready there's
         * nothing to render.
         */
        if (!moderationOpts) {
          return undefined
        }

        const tuner = new FeedTuner(feedTuners)

        /*
         * Pages are tuned in the order they were fetched, and rendered in data
         * order. So a page put above the others is tuned after them: the posts
         * it shares with them drop from it, and their rows stay as they were.
         * The sort is stable, so pages fetched in the same millisecond keep
         * their order.
         */
        const order = data.pages
          .map((_, i) => i)
          .sort((a, b) => data.pages[a].fetchedAt - data.pages[b].fetchedAt)

        // Keep track of the last run and whether we can reuse
        // some already tuned pages from there, in tune order.
        const lastRunTuned = lastRun.current?.tuned ?? []
        let canReuse = Boolean(lastRun.current)
        if (lastRun.current) {
          const lastArgs = lastRun.current.args
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
        }

        const pages: FeedPage[] = []
        for (const [k, i] of order.entries()) {
          const page = data.pages[i]
          const last = lastRunTuned[k]
          if (canReuse && last?.page === page) {
            pages[i] = last.selected
            // Keep the tuner in sync so that the end result is deterministic.
            tuner.tune(page.feed)
            continue
          }
          // Stop as soon as pages stop matching up.
          canReuse = false
          pages[i] = {
            tuner,
            cursor: page.cursor,
            startCursor: page.startCursor,
            since: page.since,
            source: page.source,
            fetchedAt: page.fetchedAt,
            slices: tuner
              .tune(page.feed)
              .map(slice =>
                toFeedPostSlice(slice, {
                  moderationOpts,
                  ignoreFilterFor,
                  isDiscover,
                }),
              )
              .filter(n => !!n),
          }
        }

        // Save for memoization.
        lastRun.current = {
          args: selectArgs,
          tuned: order.map(i => ({page: data.pages[i], selected: pages[i]})),
        }
        return {pageParams: data.pageParams, pages}
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
    {since, limit = fetchLimit}: {since?: string; limit?: number} = {},
  ): Promise<FeedPageUnselected> => {
    const api = createFeedApi()
    const res = await api.fetch({
      cursor: pageParam?.cursor,
      since,
      source: pageParam?.source,
      limit,
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
      ...(since !== undefined && {since}),
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
 * `refresh` resolves to the page it wrote, if it wrote one. One started while
 * another is pending joins it. One that finishes after the view has gone still
 * commits, which is safe, as the commit gives way to anything that has
 * replaced the top page since.
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
  const pending = useRef<Promise<FeedPageUnselected | undefined>>(undefined)

  const refreshFromTop = async () => {
    const before = queryClient.getQueryData<PostFeedData>(queryKey)
    setError(undefined)
    setIsRefreshing(true)
    try {
      const page = await fetchPage(undefined)
      const wrote = await commit(queryClient, queryKey, before, () => ({
        pages: [page],
        pageParams: [undefined],
      }))
      return wrote ? page : undefined
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to refresh posts feed', {safeMessage: e})
      }
      // Nothing to report once the feed has moved on.
      if (!isReplaced(queryClient, queryKey, before)) {
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
      return Promise.resolve(undefined)
    }
    pending.current ??= refreshFromTop()
    return pending.current
  }

  return {refresh, error, isRefreshing}
}

/**
 * When this JS process started. A page fetched before it was restored from
 * disk, which is how a restored top page is told from a fetched one without
 * marking it.
 */
export const PROCESS_STARTED_AT = Date.now()

/**
 * How many posts a prepend asks for: the most `getTimeline` allows, as a range
 * with more than this in it leaves a gap.
 */
const PREPEND_LIMIT = 100

/**
 * Puts what is newer than the feed's top page above it, with one fetch and
 * then one write through the same compare-and-swap as a refresh. The view
 * prepends above a top page restored from disk, and on a real return to the
 * app (see `PostFeed`).
 *
 * `run` starts a prepend, or joins the one in progress, so two never fetch the
 * same range. It resolves once that's done, whatever it found, and rejects if
 * the fetch fails, which leaves the feed as it was. It's `undefined` when the
 * top page has no `startCursor` to fetch above. It holds what it finds until
 * `listAtRest` resolves, so the list takes it laid out and still, however long
 * the reader keeps it moving, at any depth. `prependedAt` is the `fetchedAt`
 * of the last page it put on top.
 *
 * A top page fetched before this process started (see
 * {@link PROCESS_STARTED_AT}) is a restored one. The view prepends above it as
 * soon as it's `enabled`, while the list does its first layout, unless it has
 * already, and only once, whatever it finds. A refresh, or anything else that
 * replaces the top page first, leaves nothing to do. `isOwed` says whether a
 * prepend is in progress or still owed to a restored top, for checks for new
 * posts to wait on it rather than race it.
 *
 * It fetches with `since` set to the top page's `startCursor`. Nothing newer
 * writes nothing. Anything newer goes on top as a page of its own, with the
 * `since` it was requested with, and the page that was on top now continues
 * from its cursor. When the server echoes `since` as that cursor, the range
 * was exhausted and the pages are contiguous. Otherwise there's a gap between
 * them (see {@link gapBelow}). The write gives way to anything that has
 * replaced the top page meanwhile, and keeps any page loaded below it.
 */
export function usePostFeedPrepend(
  feedDesc: FeedDescriptor,
  params: FeedParams | undefined,
  {
    enabled,
    topFetchedAt,
    listAtRest,
  }: {
    enabled: boolean
    /** The `fetchedAt` of the top page as rendered, if there is one. */
    topFetchedAt: number | undefined
    /**
     * Resolves once the list can take posts above the reader without moving
     * them: laid out and at rest (see `useListRest`).
     */
    listAtRest: () => Promise<void>
  },
) {
  const queryClient = useQueryClient()
  const {fetchPage} = usePostFeedFetcher(feedDesc)
  const queryKey = RQKEY(feedDesc, params)
  /** The prepend in progress, fetching or holding what it found. */
  const pending = useRef<Promise<void>>(undefined)
  /** Whether this view has started a prepend, as a restored top needs once. */
  const hasStarted = useRef(false)
  const [prependedAt, setPrependedAt] = useState<number>()
  const isTopRestored = isRestored(topFetchedAt)

  const isOwed = () => {
    const top = queryClient.getQueryData<PostFeedData>(queryKey)?.pages[0]
    return (
      pending.current !== undefined ||
      (!hasStarted.current &&
        isRestored(top?.fetchedAt) &&
        top?.startCursor !== undefined)
    )
  }

  const prependAbove = async (before: PostFeedData, since: string) => {
    const page = await fetchPage(undefined, {since, limit: PREPEND_LIMIT})
    /*
     * A bounded range always comes back with a cursor, the echo of `since` or
     * one into what it didn't return, so a page without one can't go above the
     * posts below it.
     */
    const {cursor} = page
    if (!page.feed.length || cursor === undefined) {
      return
    }
    await listAtRest()
    const wrote = await commit(
      queryClient,
      queryKey,
      before,
      (data = before) => ({
        pages: [page, ...data.pages],
        pageParams: [undefined, {cursor}, ...data.pageParams.slice(1)],
      }),
    )
    if (wrote) {
      setPrependedAt(page.fetchedAt)
    }
  }

  const run = () => {
    if (pending.current) {
      return pending.current
    }
    const before = queryClient.getQueryData<PostFeedData>(queryKey)
    const since = before?.pages[0]?.startCursor
    if (!before || since === undefined) {
      return undefined
    }
    hasStarted.current = true
    const prepending = prependAbove(before, since).finally(() => {
      pending.current = undefined
    })
    pending.current = prepending
    return prepending
  }

  const onRestoredTop = useEffectEvent(() => {
    if (hasStarted.current || !isOwed()) {
      return
    }
    run()?.catch(e => {
      if (!isNetworkError(e)) {
        logger.error('Failed to fetch posts newer than a restored feed', {
          safeMessage: e,
        })
      }
    })
  })
  useEffect(() => {
    if (enabled && isTopRestored) {
      onRestoredTop()
    }
  }, [enabled, isTopRestored])

  return {run, isOwed, prependedAt}
}

/**
 * What lies between the feed's page at `index` and the page below it:
 *
 * - `open`: the page was put above the others with `since` (see
 *   {@link usePostFeedPrepend}) and its range wasn't exhausted, so
 *   some of the posts between its cursor and the page below are missing. The
 *   page below is still the one its `since` came from: it starts at that
 *   `startCursor`.
 * - `filled`: the page below continues from its cursor, as
 *   {@link usePostFeedGapFill} or a page load put it there.
 *
 * `undefined` when there's nothing missing: below any other page, and below
 * the bottom page, whose cursor ordinary pagination continues from.
 */
export function gapBelow(
  pages: readonly Pick<
    FeedPageUnselected,
    'cursor' | 'startCursor' | 'since'
  >[],
  index: number,
): 'open' | 'filled' | undefined {
  const page = pages[index]
  const below = pages[index + 1]
  if (
    !page ||
    !below ||
    page.since === undefined ||
    page.cursor === undefined ||
    page.cursor === page.since
  ) {
    return undefined
  }
  return below.startCursor === page.since ? 'open' : 'filled'
}

/**
 * The gaps to mark in a feed, by the index of the page each is below (see
 * {@link gapBelow}). An open gap with no posts between it and an open gap
 * above it is left out: the two would read as one, and filling the upper one
 * replaces everything below it, the lower one included.
 */
export function findGaps(
  pages: readonly Pick<
    FeedPage,
    'cursor' | 'startCursor' | 'since' | 'slices'
  >[],
) {
  const gaps = new Map<number, 'open' | 'filled'>()
  let isBelowOpenGap = false
  pages.forEach((page, i) => {
    if (page.slices.length) {
      isBelowOpenGap = false
    }
    const gap = gapBelow(pages, i)
    if (gap && !(gap === 'open' && isBelowOpenGap)) {
      gaps.set(i, gap)
      isBelowOpenGap = gap === 'open'
    }
  })
  return gaps
}

/**
 * How a gap fill (see {@link usePostFeedGapFill}) ended: it `filled` the gap,
 * `failed` to fetch, or was `superseded`, writing nothing, as the gap had
 * already gone or something else replaced the pages it depends on first.
 */
export type GapFillOutcome = 'filled' | 'failed' | 'superseded'

/**
 * Fills an open gap below a page (see {@link gapBelow}), named by the page's
 * cursor. It fetches the posts that continue from that cursor first, as an
 * ordinary page, then puts them in place of every page below the gap in one
 * write, so the old posts below stay readable until then and a failure leaves
 * them, and the gap, as they were. Pagination then continues from the new
 * page.
 *
 * The write depends on the pages from the top down to the one above the gap,
 * and gives way if any of them has been replaced meanwhile, as by a refresh.
 * It cancels a page load in flight below them.
 */
export function usePostFeedGapFill(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
) {
  const queryClient = useQueryClient()
  const {fetchPage} = usePostFeedFetcher(feedDesc)
  const queryKey = RQKEY(feedDesc, params)

  return async (cursor: string): Promise<GapFillOutcome> => {
    const before = queryClient.getQueryData<PostFeedData>(queryKey)
    const index = before?.pages.findIndex(page => page.cursor === cursor) ?? -1
    if (!before || gapBelow(before.pages, index) !== 'open') {
      return 'superseded'
    }
    try {
      const page = await fetchPage({cursor})
      const wrote = await commit(
        queryClient,
        queryKey,
        before,
        (data = before) => ({
          pages: [...data.pages.slice(0, index + 1), page],
          pageParams: [...data.pageParams.slice(0, index + 1), {cursor}],
        }),
        {dependsOn: index + 1},
      )
      return wrote ? 'filled' : 'superseded'
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to fetch posts missing from a feed', {
          safeMessage: e,
        })
      }
      return 'failed'
    }
  }
}

/**
 * Settles the feed once the reader has reached its true top: cuts it at its
 * first open gap (see {@link gapBelow}), keeping the pages down to the one
 * above the gap and dropping every page below it. That page's cursor goes on
 * into the gap, so ordinary pagination loads what's missing and nothing is
 * lost. A feed with no open gap is left as it is, so settling again writes
 * nothing. Resolves to whether it wrote.
 *
 * `before` is the data as it was when the reader came to rest at the top. The
 * write depends on its pages down to the one below the gap, so it gives way
 * to anything that has replaced them since, as the commit of a prepend does.
 * It never replaces the top page, so a refresh in flight still writes after
 * it.
 */
export function usePostFeedSettle(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
) {
  const queryClient = useQueryClient()
  const queryKey = RQKEY(feedDesc, params)

  return async (before: PostFeedData | undefined) => {
    const index =
      before?.pages.findIndex((_, i) => gapBelow(before.pages, i) === 'open') ??
      -1
    if (!before || index === -1) {
      return false
    }
    return commit(
      queryClient,
      queryKey,
      before,
      (data = before) => ({
        pages: data.pages.slice(0, index + 1),
        pageParams: data.pageParams.slice(0, index + 1),
      }),
      {dependsOn: index + 2},
    )
  }
}

/** Whether a page fetched at `fetchedAt` was restored from disk. */
function isRestored(fetchedAt: number | undefined) {
  return fetchedAt !== undefined && fetchedAt < PROCESS_STARTED_AT
}

/**
 * Whether something else has replaced any of the feed's first `count` pages
 * since `before`: by default, its top page.
 */
function isReplaced(
  queryClient: QueryClient,
  queryKey: QueryKey,
  before: PostFeedData | undefined,
  count = 1,
) {
  const pages = queryClient.getQueryData<PostFeedData>(queryKey)?.pages
  for (let i = 0; i < count; i++) {
    if (pages?.[i] !== before?.pages[i]) {
      return true
    }
  }
  return false
}

/**
 * Writes what `next` makes of the feed's data, unless something else has
 * replaced its top page since `before` was read (a refetch, a reset or a
 * removal) or is fetching it now. Resolves to whether it wrote.
 *
 * A write that depends on more than the top page, as one below it does, says
 * how many of `before`'s pages it depends on with `dependsOn`, and gives way
 * if any of them has been replaced.
 *
 * `next` is given the data as it is when it writes, which has the same pages
 * it depends on as `before`, and any pages a `fetchNextPage` added below
 * since.
 */
async function commit(
  queryClient: QueryClient,
  queryKey: QueryKey,
  before: PostFeedData | undefined,
  next: (data: PostFeedData | undefined) => PostFeedData,
  {dependsOn = 1}: {dependsOn?: number} = {},
) {
  const state = queryClient.getQueryState(queryKey)
  // A fetch from the top in flight will land after this write, so it wins.
  const isFetchingTop =
    state?.fetchStatus !== 'idle' && !state?.fetchMeta?.fetchMore
  if (isReplaced(queryClient, queryKey, before, dependsOn) || isFetchingTop) {
    return false
  }
  /*
   * A fetchNextPage in flight would land after this write and put back the
   * pages it replaces, so it's cancelled. Cancelling reverts its state at
   * once, and waiting for it lets one that had already resolved write first.
   * Anything fetching after that started since, from the data being replaced.
   */
  await queryClient.cancelQueries({queryKey, exact: true})
  if (
    isReplaced(queryClient, queryKey, before, dependsOn) ||
    queryClient.getQueryState(queryKey)?.fetchStatus !== 'idle'
  ) {
    return false
  }
  queryClient.setQueryData<PostFeedData>(queryKey, next)
  return true
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
