import React, {useCallback, useEffect, useRef} from 'react'
import {AppState} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  BskyAgent,
  ModerationDecision,
} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {HomeFeedAPI} from '#/lib/api/feed/home'
import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {useAgent} from '#/state/session'
import {AuthorFeedAPI} from 'lib/api/feed/author'
import {CustomFeedAPI} from 'lib/api/feed/custom'
import {FollowingFeedAPI} from 'lib/api/feed/following'
import {LikesFeedAPI} from 'lib/api/feed/likes'
import {ListFeedAPI} from 'lib/api/feed/list'
import {MergeFeedAPI} from 'lib/api/feed/merge'
import {FeedAPI, ReasonFeedSource} from 'lib/api/feed/types'
import {FeedTuner, FeedTunerFn, NoopFeedTuner} from 'lib/api/feed-manip'
import {BSKY_FEED_OWNER_DIDS} from 'lib/constants'
import {KnownError} from '#/view/com/posts/FeedErrorMessage'
import {useFeedTuners} from '../preferences/feed-tuners'
import {useModerationOpts} from './preferences'
import {embedViewRecordToPostView, getEmbeddedPost} from './util'

type ActorDid = string
type AuthorFilter =
  | 'posts_with_replies'
  | 'posts_no_replies'
  | 'posts_and_author_threads'
  | 'posts_with_media'
type FeedUri = string
type ListUri = string
export type FeedDescriptor =
  | 'home'
  | 'following'
  | `author|${ActorDid}|${AuthorFilter}`
  | `feedgen|${FeedUri}`
  | `likes|${ActorDid}`
  | `list|${ListUri}`
export interface FeedParams {
  disableTuner?: boolean
  mergeFeedEnabled?: boolean
  mergeFeedSources?: string[]
}

type RQPageParam = {cursor: string | undefined; api: FeedAPI} | undefined

const RQKEY_ROOT = 'post-feed'
export function RQKEY(feedDesc: FeedDescriptor, params?: FeedParams) {
  return [RQKEY_ROOT, feedDesc, params || {}]
}

export interface FeedPostSliceItem {
  _reactKey: string
  uri: string
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  reason?: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource
  moderation: ModerationDecision
}

export interface FeedPostSlice {
  _reactKey: string
  rootUri: string
  isThread: boolean
  items: FeedPostSliceItem[]
}

export interface FeedPageUnselected {
  api: FeedAPI
  cursor: string | undefined
  feed: AppBskyFeedDefs.FeedViewPost[]
  fetchedAt: number
}

export interface FeedPage {
  api: FeedAPI
  tuner: FeedTuner | NoopFeedTuner
  cursor: string | undefined
  slices: FeedPostSlice[]
  fetchedAt: number
}

const PAGE_SIZE = 30

export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
  opts?: {enabled?: boolean; ignoreFilterFor?: string},
) {
  const feedTuners = useFeedTuners(feedDesc)
  const moderationOpts = useModerationOpts()
  const {getAgent} = useAgent()
  const enabled = opts?.enabled !== false && Boolean(moderationOpts)
  const lastRun = useRef<{
    data: InfiniteData<FeedPageUnselected>
    args: typeof selectArgs
    result: InfiniteData<FeedPage>
  } | null>(null)
  const lastPageCountRef = useRef(0)

  // Make sure this doesn't invalidate unless really needed.
  const selectArgs = React.useMemo(
    () => ({
      feedTuners,
      disableTuner: params?.disableTuner,
      moderationOpts,
      ignoreFilterFor: opts?.ignoreFilterFor,
    }),
    [feedTuners, params?.disableTuner, moderationOpts, opts?.ignoreFilterFor],
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
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      logger.debug('usePostFeedQuery', {feedDesc, cursor: pageParam?.cursor})
      const {api, cursor} = pageParam
        ? pageParam
        : {
            api: createApi({
              feedDesc,
              feedParams: params || {},
              feedTuners,
              getAgent,
            }),
            cursor: undefined,
          }

      try {
        const res = await api.fetch({cursor, limit: PAGE_SIZE})

        /*
         * If this is a public view, we need to check if posts fail moderation.
         * If all fail, we throw an error. If only some fail, we continue and let
         * moderations happen later, which results in some posts being shown and
         * some not.
         */
        if (!getAgent().session) {
          assertSomePostsPassModeration(res.feed)
        }

        return {
          api,
          cursor: res.cursor,
          feed: res.feed,
          fetchedAt: Date.now(),
        }
      } catch (e) {
        const feedDescParts = feedDesc.split('|')
        const feedOwnerDid = new AtUri(feedDescParts[1]).hostname

        if (
          feedDescParts[0] === 'feedgen' &&
          BSKY_FEED_OWNER_DIDS.includes(feedOwnerDid)
        ) {
          logger.error(`Bluesky feed may be offline: ${feedOwnerDid}`, {
            feedDesc,
            jsError: e,
          })
        }

        throw e
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage =>
      lastPage.cursor
        ? {
            api: lastPage.api,
            cursor: lastPage.cursor,
          }
        : undefined,
    select: useCallback(
      (data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
        // If the selection depends on some data, that data should
        // be included in the selectArgs object and read here.
        const {feedTuners, disableTuner, moderationOpts, ignoreFilterFor} =
          selectArgs

        const tuner = disableTuner
          ? new NoopFeedTuner()
          : new FeedTuner(feedTuners)

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
              api: page.api,
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

                  return {
                    _reactKey: slice._reactKey,
                    rootUri: slice.rootItem.post.uri,
                    isThread:
                      slice.items.length > 1 &&
                      slice.items.every(
                        item =>
                          item.post.author.did ===
                          slice.items[0].post.author.did,
                      ),
                    items: slice.items
                      .map((item, i) => {
                        if (
                          AppBskyFeedPost.isRecord(item.post.record) &&
                          AppBskyFeedPost.validateRecord(item.post.record)
                            .success
                        ) {
                          return {
                            _reactKey: `${slice._reactKey}-${i}-${item.post.uri}`,
                            uri: item.post.uri,
                            post: item.post,
                            record: item.post.record,
                            reason:
                              i === 0 && slice.source
                                ? slice.source
                                : item.reason,
                            moderation: moderations[i],
                          }
                        }
                        return undefined
                      })
                      .filter(Boolean) as FeedPostSliceItem[],
                  }
                })
                .filter(Boolean) as FeedPostSlice[],
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
      for (const slice of page.slices) {
        count += slice.items.length
      }
    }
    if (count < PAGE_SIZE && (data?.pages.length || 0) < 6) {
      query.fetchNextPage()
      lastPageCountRef.current = data?.pages?.length || 0
    }
  }, [query])

  return query
}

export async function pollLatest(page: FeedPage | undefined) {
  if (!page) {
    return false
  }
  if (AppState.currentState !== 'active') {
    return
  }

  logger.debug('usePostFeedQuery: pollLatest')
  const post = await page.api.peekLatest()
  if (post) {
    const slices = page.tuner.tune([post], {
      dryRun: true,
      maintainOrder: true,
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
  getAgent,
}: {
  feedDesc: FeedDescriptor
  feedParams: FeedParams
  feedTuners: FeedTunerFn[]
  getAgent: () => BskyAgent
}) {
  if (feedDesc === 'home') {
    if (feedParams.mergeFeedEnabled) {
      return new MergeFeedAPI({
        getAgent,
        feedParams,
        feedTuners,
      })
    } else {
      return new HomeFeedAPI({getAgent})
    }
  } else if (feedDesc === 'following') {
    return new FollowingFeedAPI({getAgent})
  } else if (feedDesc.startsWith('author')) {
    const [_, actor, filter] = feedDesc.split('|')
    return new AuthorFeedAPI({getAgent, feedParams: {actor, filter}})
  } else if (feedDesc.startsWith('likes')) {
    const [_, actor] = feedDesc.split('|')
    return new LikesFeedAPI({getAgent, feedParams: {actor}})
  } else if (feedDesc.startsWith('feedgen')) {
    const [_, feed] = feedDesc.split('|')
    return new CustomFeedAPI({
      getAgent,
      feedParams: {feed},
    })
  } else if (feedDesc.startsWith('list')) {
    const [_, list] = feedDesc.split('|')
    return new ListFeedAPI({getAgent, feedParams: {list}})
  } else {
    // shouldnt happen
    return new FollowingFeedAPI({getAgent})
  }
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
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
        if (item.post.uri === uri) {
          yield item.post
        }
        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost?.uri === uri) {
          yield embedViewRecordToPostView(quotedPost)
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.parent) &&
          item.reply?.parent?.uri === uri
        ) {
          yield item.reply.parent
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.root) &&
          item.reply?.root?.uri === uri
        ) {
          yield item.reply.root
        }
      }
    }
  }
}

function assertSomePostsPassModeration(feed: AppBskyFeedDefs.FeedViewPost[]) {
  // no posts in this feed
  if (feed.length === 0) return true

  // assume false
  let somePostsPassModeration = false

  for (const item of feed) {
    const moderation = moderatePost(item.post, {
      userDid: undefined,
      prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
    })

    if (!moderation.ui('contentList').filter) {
      // we have a sfw post
      somePostsPassModeration = true
    }
  }

  if (!somePostsPassModeration) {
    throw new Error(KnownError.FeedNSFPublic)
  }
}

export function resetPostsFeedQueries(queryClient: QueryClient, timeout = 0) {
  setTimeout(() => {
    queryClient.resetQueries({
      predicate: query => query.queryKey[0] === RQKEY_ROOT,
    })
  }, timeout)
}

export function resetProfilePostsQueries(
  queryClient: QueryClient,
  did: string,
  timeout = 0,
) {
  setTimeout(() => {
    queryClient.resetQueries({
      predicate: query =>
        !!(
          query.queryKey[0] === RQKEY_ROOT &&
          (query.queryKey[1] as string)?.includes(did)
        ),
    })
  }, timeout)
}
