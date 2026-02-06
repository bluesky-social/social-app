import {useMemo} from 'react'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  AtUri,
  moderatePost,
  type ModerationDecision,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {communityXrpc} from '#/lib/api/community'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY_ROOT = 'community-feed'
export const RQKEY = (actor: string) => [RQKEY_ROOT, actor]

const TIMELINE_RQKEY_ROOT = 'community-timeline'
export const TIMELINE_RQKEY = () => [TIMELINE_RQKEY_ROOT]

// Server returns feedViewPost format with hydrated posts
// Support both old 'posts' format (raw) and new 'feed' format (hydrated)
interface CommunityFeedPage {
  cursor?: string
  feed?: AppBskyFeedDefs.FeedViewPost[]
  // Legacy format for backward compatibility during deployment
  posts?: Array<{
    uri: string
    cid?: string
    creator: string
    text: string
    createdAt: string
    indexedAt: string
  }>
}

export function useCommunityFeedQuery(actor: string | undefined) {
  const agent = useAgent()
  return useInfiniteQuery<
    CommunityFeedPage,
    Error,
    InfiniteData<CommunityFeedPage>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(actor || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const params: Record<string, string> = {
        actor: actor || '',
        limit: String(PAGE_SIZE),
      }
      if (pageParam) {
        params.cursor = pageParam
      }
      const res = await communityXrpc(
        agent,
        'community.blacksky.feed.getCommunityFeed',
        {params},
      )
      if (!res.ok) {
        throw new Error(`getCommunityFeed failed: ${res.status}`)
      }
      return (await res.json()) as CommunityFeedPage
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!actor,
  })
}

/**
 * Query for the global community timeline (all community posts).
 * Used on the Home screen Community tab.
 */
export function useCommunityTimelineQuery(enabled: boolean) {
  const agent = useAgent()
  return useInfiniteQuery<
    CommunityFeedPage,
    Error,
    InfiniteData<CommunityFeedPage>,
    QueryKey,
    RQPageParam
  >({
    queryKey: TIMELINE_RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
      }
      if (pageParam) {
        params.cursor = pageParam
      }
      const res = await communityXrpc(
        agent,
        'community.blacksky.feed.getCommunityTimeline',
        {params},
      )
      if (!res.ok) {
        throw new Error(`getCommunityTimeline failed: ${res.status}`)
      }
      return (await res.json()) as CommunityFeedPage
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })
}

const COMMUNITY_POST_RQKEY_ROOT = 'community-post'
export const COMMUNITY_POST_RQKEY = (uri: string) => [
  COMMUNITY_POST_RQKEY_ROOT,
  uri,
]

export function useCommunityPostQuery(uri: string | undefined) {
  const agent = useAgent()
  return useQuery<AppBskyFeedDefs.PostView>({
    queryKey: COMMUNITY_POST_RQKEY(uri || ''),
    async queryFn() {
      const res = await communityXrpc(
        agent,
        'community.blacksky.feed.getCommunityPost',
        {params: {uri: uri || ''}},
      )
      if (!res.ok) {
        throw new Error(`getCommunityPost failed: ${res.status}`)
      }
      const data = (await res.json()) as {post: AppBskyFeedDefs.PostView}
      return data.post
    },
    enabled: !!uri,
  })
}

export interface HydratedCommunityPost {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  moderation: ModerationDecision
}

/**
 * Takes pre-hydrated feed items from the server and adds moderation decisions.
 * The server now returns properly hydrated PostViews with author info and counts.
 */
export function useCommunityFeedHydrated(
  feedItems: AppBskyFeedDefs.FeedViewPost[],
): HydratedCommunityPost[] {
  const moderationOpts = useModerationOpts()

  return useMemo(() => {
    if (!moderationOpts) return []

    return feedItems
      .filter(item => item?.post) // Filter out any undefined items
      .map(item => {
        const postView = item.post
        const record = postView.record as AppBskyFeedPost.Record
        const moderation = moderatePost(postView, moderationOpts)
        return {post: postView, record, moderation}
      })
  }, [feedItems, moderationOpts])
}

/**
 * Generator function to find all posts in the community feed cache.
 * Used by the post shadow system to update cached posts after mutations.
 */
export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  const atUri = new AtUri(uri)

  // Search both actor feeds and timeline
  const queryDatas = [
    ...queryClient.getQueriesData<InfiniteData<CommunityFeedPage>>({
      queryKey: [RQKEY_ROOT],
    }),
    ...queryClient.getQueriesData<InfiniteData<CommunityFeedPage>>({
      queryKey: [TIMELINE_RQKEY_ROOT],
    }),
  ]

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData.pages) {
      if (!page.feed) {
        continue
      }
      for (const item of page.feed) {
        if (!item?.post) {
          continue
        }
        if (didOrHandleUriMatches(atUri, item.post)) {
          yield item.post
        }

        // Check for quoted posts in embeds
        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}
