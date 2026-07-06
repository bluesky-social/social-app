import {useMemo} from 'react'
import {
  AppBskyFeedDefs,
  type AppBskyFeedPost,
  AtUri,
  jsonToLex,
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
import {FeedTuner} from '#/lib/api/feed-manip'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePreferencesQuery} from '#/state/queries/preferences'
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
      return jsonToLex(await res.json()) as CommunityFeedPage
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
      return jsonToLex(await res.json()) as CommunityFeedPage
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
      const data = jsonToLex(await res.json()) as {
        post: AppBskyFeedDefs.PostView
      }
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

export interface CommunityFeedSliceItem extends HydratedCommunityPost {
  _reactKey: string
  uri: string
  parentAuthor?: AppBskyFeedDefs.PostView['author']
}

export interface CommunityFeedSlice {
  _reactKey: string
  items: CommunityFeedSliceItem[]
  isIncompleteThread: boolean
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

// Group feed items into slices so a self-reply (parent + reply by same author)
// renders as one visually-connected card instead of two flat ones.
export function useCommunityFeedSlices(
  feedItems: AppBskyFeedDefs.FeedViewPost[],
): CommunityFeedSlice[] {
  const moderationOpts = useModerationOpts()
  const {data: preferences} = usePreferencesQuery()

  return useMemo(() => {
    if (!moderationOpts) return []
    // A reply only resurfaces its thread when the root author is
    // continuing their own thread; other people's replies stay in the
    // thread view. Stands in for followedRepliesOnly, which would pass
    // everything here since the whole community is "followed".
    const surfaced = feedItems.filter(item => {
      // Blocked/muted authors never surface, same as the Following feed.
      const authorViewer = item.post.author.viewer
      if (
        authorViewer?.blocking ||
        authorViewer?.blockedBy ||
        authorViewer?.muted
      ) {
        return false
      }
      const reply = (item.post.record as AppBskyFeedPost.Record)?.reply
      if (!reply?.root?.uri) return true
      return new AtUri(reply.root.uri).host === item.post.author.did
    })
    // Same tuner stack as the Following feed (see useFeedTuners).
    const tunerFns = [FeedTuner.removeOrphans]
    if (preferences?.feedViewPrefs.hideReposts) {
      tunerFns.push(FeedTuner.removeReposts)
    }
    if (preferences?.feedViewPrefs.hideReplies) {
      tunerFns.push(FeedTuner.removeReplies)
    }
    if (preferences?.feedViewPrefs.hideQuotePosts) {
      tunerFns.push(FeedTuner.removeQuotePosts)
    }
    tunerFns.push(FeedTuner.dedupThreads)
    tunerFns.push(FeedTuner.removeMutedThreads)
    const tuner = new FeedTuner(tunerFns)
    const raw = tuner.tune(surfaced)

    return raw
      .map((slice, sliceIdx) => {
        const items: CommunityFeedSliceItem[] = slice.items.map((item, i) => {
          const record = item.post.record as AppBskyFeedPost.Record
          return {
            _reactKey: `${slice._reactKey}-${i}-${item.post.uri}`,
            uri: item.post.uri,
            post: item.post,
            record,
            moderation: moderatePost(item.post, moderationOpts),
            parentAuthor: item.parentAuthor as any,
          }
        })
        return {
          _reactKey: slice._reactKey || `slice-${sliceIdx}`,
          items,
          isIncompleteThread: slice.isIncompleteThread,
        }
      })
      .filter(slice => {
        // Nuclear block: drop the whole thread if any author in it is
        // blocked or blocking the viewer, matching the standard app.
        const hasBlock = slice.items.some(item => {
          const v = item.post.author.viewer
          return !!(v?.blocking || v?.blockedBy)
        })
        if (hasBlock) return false
        // Drop items the moderation engine filters from list contexts
        // (hidden-for-me posts, muted authors, etc.).
        slice.items = slice.items.filter(
          item => !item.moderation.ui('contentList').filter,
        )
        return slice.items.length > 0
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

        // Reply-context rows render in slices too; without these, likes on
        // a parent/root row never reach the shadow cache.
        if (AppBskyFeedDefs.isPostView(item.reply?.parent)) {
          if (didOrHandleUriMatches(atUri, item.reply.parent)) {
            yield item.reply.parent
          }
        }
        if (AppBskyFeedDefs.isPostView(item.reply?.root)) {
          if (didOrHandleUriMatches(atUri, item.reply.root)) {
            yield item.reply.root
          }
        }
      }
    }
  }
}
