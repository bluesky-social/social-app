import {useCallback, useMemo} from 'react'
import {AppBskyFeedDefs, AppBskyFeedPost, moderatePost} from '@atproto/api'
import {
  useInfiniteQuery,
  InfiniteData,
  QueryKey,
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query'
import {useFeedTuners} from '../preferences/feed-tuners'
import {FeedTuner, NoopFeedTuner} from 'lib/api/feed-manip'
import {FeedAPI, ReasonFeedSource} from 'lib/api/feed/types'
import {FollowingFeedAPI} from 'lib/api/feed/following'
import {AuthorFeedAPI} from 'lib/api/feed/author'
import {LikesFeedAPI} from 'lib/api/feed/likes'
import {CustomFeedAPI} from 'lib/api/feed/custom'
import {ListFeedAPI} from 'lib/api/feed/list'
import {MergeFeedAPI} from 'lib/api/feed/merge'
import {useModerationOpts} from '#/state/queries/preferences'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {precacheFeedPosts as precacheResolvedUris} from './resolve-uri'

type ActorDid = string
type AuthorFilter =
  | 'posts_with_replies'
  | 'posts_no_replies'
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

type RQPageParam = string | undefined

export function RQKEY(feedDesc: FeedDescriptor, params?: FeedParams) {
  return ['post-feed', feedDesc, params || {}]
}

export interface FeedPostSliceItem {
  _reactKey: string
  uri: string
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  reason?: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource
}

export interface FeedPostSlice {
  _reactKey: string
  rootUri: string
  isThread: boolean
  items: FeedPostSliceItem[]
}

export interface FeedPage {
  cursor: string | undefined
  slices: FeedPostSlice[]
}

export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
  opts?: {enabled?: boolean},
) {
  const queryClient = useQueryClient()
  const feedTuners = useFeedTuners(feedDesc)
  const enabled = opts?.enabled !== false
  const moderationOpts = useModerationOpts()

  const api: FeedAPI = useMemo(() => {
    if (feedDesc === 'home') {
      return new MergeFeedAPI(params || {}, feedTuners)
    } else if (feedDesc === 'following') {
      return new FollowingFeedAPI()
    } else if (feedDesc.startsWith('author')) {
      const [_, actor, filter] = feedDesc.split('|')
      return new AuthorFeedAPI({actor, filter})
    } else if (feedDesc.startsWith('likes')) {
      const [_, actor] = feedDesc.split('|')
      return new LikesFeedAPI({actor})
    } else if (feedDesc.startsWith('feedgen')) {
      const [_, feed] = feedDesc.split('|')
      return new CustomFeedAPI({feed})
    } else if (feedDesc.startsWith('list')) {
      const [_, list] = feedDesc.split('|')
      return new ListFeedAPI({list})
    } else {
      // shouldnt happen
      return new FollowingFeedAPI()
    }
  }, [feedDesc, params, feedTuners])

  const disableTuner = !!params?.disableTuner
  const tuner = useMemo(
    () => (disableTuner ? new NoopFeedTuner() : new FeedTuner()),
    [disableTuner],
  )

  const pollLatest = useCallback(async () => {
    if (!enabled) {
      return false
    }

    logger.debug('usePostFeedQuery: pollLatest')

    const post = await api.peekLatest()

    if (post && moderationOpts) {
      const slices = tuner.tune([post], feedTuners, {
        dryRun: true,
        maintainOrder: true,
      })
      if (slices[0]) {
        if (
          !moderatePost(slices[0].items[0].post, moderationOpts).content.filter
        ) {
          return true
        }
      }
    }

    return false
  }, [api, tuner, feedTuners, moderationOpts, enabled])

  const out = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(feedDesc, params),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      logger.debug('usePostFeedQuery', {feedDesc, pageParam})
      if (!pageParam) {
        tuner.reset()
      }
      const res = await api.fetch({cursor: pageParam, limit: 30})
      precacheResolvedUris(queryClient, res.feed) // precache the handle->did resolution
      const slices = tuner.tune(res.feed, feedTuners)
      return {
        cursor: res.cursor,
        slices: slices.map(slice => ({
          _reactKey: slice._reactKey,
          rootUri: slice.rootItem.post.uri,
          isThread:
            slice.items.length > 1 &&
            slice.items.every(
              item => item.post.author.did === slice.items[0].post.author.did,
            ),
          items: slice.items
            .map((item, i) => {
              if (
                AppBskyFeedPost.isRecord(item.post.record) &&
                AppBskyFeedPost.validateRecord(item.post.record).success
              ) {
                return {
                  _reactKey: `${slice._reactKey}-${i}`,
                  uri: item.post.uri,
                  post: item.post,
                  record: item.post.record,
                  reason: i === 0 && slice.source ? slice.source : item.reason,
                }
              }
              return undefined
            })
            .filter(Boolean) as FeedPostSliceItem[],
        })),
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })

  return {...out, pollLatest}
}

/**
 * This helper is used by the post-thread placeholder function to
 * find a post in the query-data cache
 */
export function findPostInQueryData(
  queryClient: QueryClient,
  uri: string,
): FeedPostSliceItem | undefined {
  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: ['post-feed'],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const slice of page.slices) {
        for (const item of slice.items) {
          if (item.uri === uri) {
            return item
          }
        }
      }
    }
  }
  return undefined
}
