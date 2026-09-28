import {useCallback, useMemo, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {type Client} from '@atproto/lex'
import {type AtIdentifierString, AtUri, type AtUriString} from '@atproto/syntax'
import {
  moderatePost,
  type ModerationDecision,
  type ModerationPrefs,
} from '@bsky/sdk/moderation'
import {
  type InfiniteData,
  type Query,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {AuthorFeedAPI} from '#/lib/api/feed/author'
import {CustomFeedAPI} from '#/lib/api/feed/custom'
import {DemoFeedAPI} from '#/lib/api/feed/demo'
import {FollowingFeedAPI} from '#/lib/api/feed/following'
import {HomeFeedAPI} from '#/lib/api/feed/home'
import {LikesFeedAPI} from '#/lib/api/feed/likes'
import {ListFeedAPI} from '#/lib/api/feed/list'
import {MergeFeedAPI} from '#/lib/api/feed/merge'
import {PostListFeedAPI} from '#/lib/api/feed/posts'
import {type FeedAPI, type ReasonFeedSource} from '#/lib/api/feed/types'
import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {
  createFeedViewPostsSlices,
  type FeedPostNumbering,
  FeedTuner,
  type FeedTunerFn,
  type ValidFeedPostNumbering,
} from '#/lib/api/feed-manip'
import {DISCOVER_FEED_URI} from '#/lib/constants'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {useAppviewClient, useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {KnownError} from '#/view/com/posts/PostFeedErrorMessage'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {useFeedTuners} from '../preferences/feed-tuners'
import {useModerationOpts} from '../preferences/moderation-opts'
import {
  getPostFeedQueryEntry,
  peekPostFeedQueryEntry,
  refreshPostFeedQuery,
  supersedePostFeedRefresh,
  supersedePostFeedRefreshes,
} from './post-feed-registry'
import {usePreferencesQuery} from './preferences'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
  useAutoPagination,
} from './util'

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
  mergeFeedEnabled?: boolean
  mergeFeedSources?: string[]
  feedCacheKey?: 'discover' | 'explore' | undefined
}

type RQPageParam = {cursor: string | undefined} | undefined

export const RQKEY_ROOT = 'post-feed'
export function RQKEY(feedDesc: FeedDescriptor, params?: FeedParams) {
  return [RQKEY_ROOT, feedDesc, params || {}]
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
  feed: app.bsky.feed.defs.FeedViewPost[]
  fetchedAt: number
}

export interface FeedPage {
  tuner: FeedTuner
  cursor: string | undefined
  slices: FeedPostSlice[]
  fetchedAt: number
}

/**
 * The minimum number of posts we want in a single "page" of results. Since we
 * filter out unwanted content, we may fetch more than this number to ensure
 * that we get _at least_ this number.
 */
const MIN_POSTS = 30

/**
 * What fetching a page of this feed needs, shared by the query and by
 * {@link usePostFeedRefresh} so that both build the same API and page.
 */
function usePostFeedFetcher(feedDesc: FeedDescriptor, params?: FeedParams) {
  const feedTuners = useFeedTuners(feedDesc)
  const moderationOpts = useModerationOpts()
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

  return {
    feedTuners,
    moderationOpts,
    /**
     * Load bearing: we need to await AA state or risk FOUC. This marginally
     * delays feeds, but AA state is fetched immediately on load and is then
     * available for the remainder of the session, so this delay only affects
     * cold loads. -esb
     */
    isReady: Boolean(moderationOpts) && Boolean(preferences),
    createFeedApi: () =>
      createApi({
        feedDesc,
        feedParams: params || {},
        feedTuners,
        client,
        // Not in the query key because they don't change:
        userInterests,
        // Not in the query key. Reacting to it switching isn't important:
        enableFollowingToDiscoverFallback,
      }),
    async fetchPage(
      api: FeedAPI,
      cursor: string | undefined,
    ): Promise<FeedPageUnselected> {
      const res = await api.fetch({cursor, limit: fetchLimit})

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
        feed: res.feed,
        fetchedAt: Date.now(),
      }
    },
  }
}

export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
  opts?: {enabled?: boolean; ignoreFilterFor?: string},
) {
  const {feedTuners, moderationOpts, isReady, createFeedApi, fetchPage} =
    usePostFeedFetcher(feedDesc, params)
  const enabled = opts?.enabled !== false && isReady
  const queryClient = useQueryClient()
  const queryKey = RQKEY(feedDesc, params)
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
    // The API registry relies on page object identity.
    structuralSharing: false,
    queryKey,
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      logger.debug('usePostFeedQuery', {feedDesc, cursor: pageParam?.cursor})
      const entry = getPostFeedQueryEntry(queryClient, queryKey)
      if (!pageParam) {
        // A fetch from the top overtakes any refresh in flight.
        supersedePostFeedRefresh(entry)
      }
      const api =
        (pageParam && entry.feedApis.get(pageParam)) || createFeedApi()
      const page = await fetchPage(api, pageParam?.cursor)
      entry.feedApis.set(page, api)
      return page
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      if (!lastPage.cursor) {
        return undefined
      }
      const pageParam = {cursor: lastPage.cursor}
      const feedApis = peekPostFeedQueryEntry(queryClient, queryKey)?.feedApis
      const api = feedApis?.get(lastPage)
      if (feedApis && api) {
        feedApis.set(pageParam, api)
      }
      return pageParam
    },
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
              fetchedAt: page.fetchedAt,
              slices: tuner
                .tune(page.feed)
                .map(slice => {
                  const moderations = slice.items.map(item =>
                    moderatePost(item.post, moderationOpts!),
                  )

                  // apply moderation filter
                  for (let i = 0; i < slice.items.length; i++) {
                    const ignoreFilter =
                      slice.items[i].post.author.did === ignoreFilterFor
                    if (ignoreFilter) {
                      // remove mutes to avoid confused UIs
                      moderations[i].causes = moderations[i].causes.filter(
                        cause => cause.type !== 'muted',
                      )
                    }
                    if (
                      !ignoreFilter &&
                      moderations[i]?.ui('contentList').filter
                    ) {
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
                        isFollowedBy: Boolean(
                          item.post.author.viewer?.followedBy,
                        ),
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
                })
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
 * Refreshes this feed from the top in one write, keeping what it has if the
 * fetch fails - see {@link refreshPostFeedQuery}. `refresh` resolves with the
 * page that was written, or `undefined` if nothing was, and never rejects.
 *
 * The state is this view's own: `error` is why its latest refresh failed,
 * cleared as soon as it starts another, and `isRefreshing` is whether that
 * latest refresh is still in flight.
 *
 * Only used with Following v2 for now. Otherwise feeds still refresh through
 * TanStack (`truncateAndInvalidate` and the like).
 */
export function usePostFeedRefresh(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
) {
  const queryClient = useQueryClient()
  const {isReady, createFeedApi, fetchPage} = usePostFeedFetcher(
    feedDesc,
    params,
  )
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  /** Counts this view's refreshes, so that only the latest sets the state. */
  const latestRefreshRef = useRef(0)

  const refresh = async (): Promise<FeedPageUnselected | undefined> => {
    // Nothing may land before the query itself would be allowed to fetch.
    if (!isReady) {
      return undefined
    }
    logger.debug('usePostFeedRefresh', {feedDesc})
    const refreshId = ++latestRefreshRef.current
    const isLatest = () => latestRefreshRef.current === refreshId
    setError(undefined)
    setIsRefreshing(true)
    try {
      return await refreshPostFeedQuery(
        queryClient,
        RQKEY(feedDesc, params),
        async () => {
          const api = createFeedApi()
          return {api, page: await fetchPage(api, undefined)}
        },
      )
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to refresh posts feed', {message: e})
      }
      if (isLatest()) {
        setError(e instanceof Error ? e : new Error(String(e)))
      }
      return undefined
    } finally {
      if (isLatest()) {
        setIsRefreshing(false)
      }
    }
  }

  return {refresh, error, isRefreshing}
}

export async function pollLatest(
  queryClient: QueryClient,
  queryKey: QueryKey,
  page: FeedPage | undefined,
) {
  if (!page) {
    return false
  }
  if (AppState.currentState !== 'active') {
    return
  }

  const firstPage =
    queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(queryKey)
      ?.pages[0]
  const api =
    firstPage &&
    peekPostFeedQueryEntry(queryClient, queryKey)?.feedApis.get(firstPage)
  if (!api) {
    return false
  }

  logger.debug('usePostFeedQuery: pollLatest')
  const post = await api.peekLatest()
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
  feedParams,
  feedTuners,
  userInterests,
  client,
  enableFollowingToDiscoverFallback,
}: {
  feedDesc: FeedDescriptor
  feedParams: FeedParams
  feedTuners: FeedTunerFn[]
  userInterests?: string
  client: Client
  enableFollowingToDiscoverFallback: boolean
}) {
  if (feedDesc === 'following') {
    if (feedParams.mergeFeedEnabled) {
      return new MergeFeedAPI({
        client,
        feedParams,
        feedTuners,
        userInterests,
      })
    } else {
      if (enableFollowingToDiscoverFallback) {
        return new HomeFeedAPI({client, userInterests})
      } else {
        return new FollowingFeedAPI({client})
      }
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

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<app.bsky.feed.defs.PostView, undefined> {
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<
    InfiniteData<FeedPageUnselected>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.feed) {
        if (didOrHandleUriMatches(atUri, item.post)) {
          yield item.post
        }

        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }

        if (bsky.isType(app.bsky.feed.defs.postView, item.reply?.parent)) {
          if (didOrHandleUriMatches(atUri, item.reply.parent)) {
            yield item.reply.parent
          }

          const parentQuotedPost = getEmbeddedPost(item.reply.parent.embed)
          if (
            parentQuotedPost &&
            didOrHandleUriMatches(atUri, parentQuotedPost)
          ) {
            yield embedViewRecordToPostView(parentQuotedPost)
          }
        }

        if (bsky.isType(app.bsky.feed.defs.postView, item.reply?.root)) {
          if (didOrHandleUriMatches(atUri, item.reply.root)) {
            yield item.reply.root
          }

          const rootQuotedPost = getEmbeddedPost(item.reply.root.embed)
          if (rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost)) {
            yield embedViewRecordToPostView(rootQuotedPost)
          }
        }
      }
    }
  }
}

export function findPostNumberingInQueryData(
  queryClient: QueryClient,
  uri: string,
): ValidFeedPostNumbering | undefined {
  const atUri = new AtUri(uri)
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<FeedPageUnselected>
  >({
    queryKey: [RQKEY_ROOT],
  })

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) continue

    for (const page of queryData.pages) {
      for (const slice of createFeedViewPostsSlices(page.feed)) {
        for (const item of slice.items) {
          if (item.postNumbering && didOrHandleUriMatches(atUri, item.post)) {
            return item.postNumbering
          }
        }
      }
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileViewBasic, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<FeedPageUnselected>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.feed) {
        if (item.post.author.did === did) {
          yield item.post.author
        }
        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
        if (
          bsky.isType(app.bsky.feed.defs.postView, item.reply?.parent) &&
          item.reply?.parent?.author.did === did
        ) {
          yield item.reply.parent.author
        }
        if (
          bsky.isType(app.bsky.feed.defs.postView, item.reply?.root) &&
          item.reply?.root?.author.did === did
        ) {
          yield item.reply.root.author
        }
      }
    }
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

export function resetPostsFeedQueries(queryClient: QueryClient, timeout = 0) {
  setTimeout(() => {
    const filters = {
      predicate: (query: Query) => query.queryKey[0] === RQKEY_ROOT,
    }
    // Whatever a refresh in flight fetches predates the change behind this.
    supersedePostFeedRefreshes(queryClient, filters)
    queryClient.resetQueries(filters)
  }, timeout)
}

export function resetProfilePostsQueries(
  queryClient: QueryClient,
  did: string,
  timeout = 0,
) {
  setTimeout(() => {
    const filters = {
      predicate: (query: Query) =>
        !!(
          query.queryKey[0] === RQKEY_ROOT &&
          (query.queryKey[1] as string)?.includes(did)
        ),
    }
    // Whatever a refresh in flight fetches predates the change behind this.
    supersedePostFeedRefreshes(queryClient, filters)
    queryClient.resetQueries(filters)
  }, timeout)
}

export function isFeedPostSlice(v: any): v is FeedPostSlice {
  return (
    v && typeof v === 'object' && '_isFeedPostSlice' in v && v._isFeedPostSlice
  )
}
