import {AppBskyFeedDefs, AppBskyFeedGetPostThread} from '@atproto/api'
import {useQuery, QueryClient, useQueryClient} from '@tanstack/react-query'
import {useSession} from '../session'
import {RQKEY as POST_RQKEY, getCachedPost} from './post'
import {ThreadViewPreference} from '../models/ui/preferences'

export const RQKEY = (uri: string) => ['post-thread', uri]
type ThreadViewNode = AppBskyFeedGetPostThread.OutputSchema['thread']

export interface PostThreadSkeletonCtx {
  depth: number
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
}

export type PostThreadSkeletonPost = {
  type: 'post'
  _reactKey: string
  uri: string
  parent?: PostThreadSkeletonNode
  replies?: PostThreadSkeletonNode[]
  viewer?: AppBskyFeedDefs.ViewerThreadState
  ctx: PostThreadSkeletonCtx
}

export type PostThreadSkeletonNotFound = {
  type: 'not-found'
  _reactKey: string
  uri: string
  ctx: PostThreadSkeletonCtx
}

export type PostThreadSkeletonBlocked = {
  type: 'blocked'
  _reactKey: string
  uri: string
  ctx: PostThreadSkeletonCtx
}

export type PostThreadSkeletonUnknown = {
  type: 'unknown'
  uri: string
}

export type PostThreadSkeletonNode =
  | PostThreadSkeletonPost
  | PostThreadSkeletonNotFound
  | PostThreadSkeletonBlocked
  | PostThreadSkeletonUnknown

export function usePostThreadQuery(uri: string | undefined) {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useQuery<PostThreadSkeletonNode, Error>(
    RQKEY(uri || ''),
    async () => {
      const res = await agent.getPostThread({uri: uri!})
      if (res.success) {
        hydrateCache(queryClient, res.data.thread)
        return threadViewToSkeleton(res.data.thread)
      }
      return {type: 'unknown', uri: uri!}
    },
    {enabled: !!uri},
  )
}

export function sortThreadSkeleton(
  queryClient: QueryClient,
  node: PostThreadSkeletonNode,
  opts: ThreadViewPreference,
): PostThreadSkeletonNode {
  if (node.type !== 'post') {
    return node
  }
  if (node.replies) {
    const post = getCachedPost(queryClient, node.uri)
    node.replies.sort(
      (a: PostThreadSkeletonNode, b: PostThreadSkeletonNode) => {
        if (a.type !== 'post') {
          return 1
        }
        if (b.type !== 'post') {
          return -1
        }

        const postA = getCachedPost(queryClient, a.uri)
        const postB = getCachedPost(queryClient, b.uri)
        if (!postA) {
          return 1
        }
        if (!postB) {
          return -1
        }

        const aIsByOp = postA.author.did === post?.author.did
        const bIsByOp = postB.author.did === post?.author.did
        if (aIsByOp && bIsByOp) {
          return postA.indexedAt.localeCompare(postB.indexedAt) // oldest
        } else if (aIsByOp) {
          return -1 // op's own reply
        } else if (bIsByOp) {
          return 1 // op's own reply
        }
        if (opts.prioritizeFollowedUsers) {
          const af = postA.author.viewer?.following
          const bf = postB.author.viewer?.following
          if (af && !bf) {
            return -1
          } else if (!af && bf) {
            return 1
          }
        }
        if (opts.sort === 'oldest') {
          return postA.indexedAt.localeCompare(postB.indexedAt)
        } else if (opts.sort === 'newest') {
          return postB.indexedAt.localeCompare(postA.indexedAt)
        } else if (opts.sort === 'most-likes') {
          if (postA.likeCount === postB.likeCount) {
            return postB.indexedAt.localeCompare(postA.indexedAt) // newest
          } else {
            return (postB.likeCount || 0) - (postA.likeCount || 0) // most likes
          }
        } else if (opts.sort === 'random') {
          return 0.5 - Math.random() // this is vaguely criminal but we can get away with it
        }
        return postB.indexedAt.localeCompare(postA.indexedAt)
      },
    )
    node.replies.forEach(reply => sortThreadSkeleton(queryClient, reply, opts))
  }
  return node
}

// internal methods
// =

function threadViewToSkeleton(
  node: ThreadViewNode,
  depth = 0,
  direction: 'up' | 'down' | 'start' = 'start',
): PostThreadSkeletonNode {
  if (AppBskyFeedDefs.isThreadViewPost(node)) {
    return {
      type: 'post',
      _reactKey: node.post.uri,
      uri: node.post.uri,
      parent:
        node.parent && direction !== 'down'
          ? threadViewToSkeleton(node.parent, depth - 1, 'up')
          : undefined,
      replies:
        node.replies?.length && direction !== 'up'
          ? node.replies.map(reply =>
              threadViewToSkeleton(reply, depth + 1, 'down'),
            )
          : undefined,
      viewer: node.viewer,
      ctx: {
        depth,
        isHighlightedPost: depth === 0,
        hasMore:
          direction === 'down' && !node.replies?.length && !!node.replyCount,
        showChildReplyLine:
          direction === 'up' ||
          (direction === 'down' && !!node.replies?.length),
        showParentReplyLine:
          (direction === 'up' && !!node.parent) ||
          (direction === 'down' && depth !== 1),
      },
    }
  } else if (AppBskyFeedDefs.isBlockedPost(node)) {
    return {type: 'blocked', _reactKey: node.uri, uri: node.uri, ctx: {depth}}
  } else if (AppBskyFeedDefs.isNotFoundPost(node)) {
    return {type: 'not-found', _reactKey: node.uri, uri: node.uri, ctx: {depth}}
  } else {
    return {type: 'unknown', uri: ''}
  }
}

function hydrateCache(queryClient: QueryClient, node: ThreadViewNode) {
  if (AppBskyFeedDefs.isThreadViewPost(node)) {
    queryClient.setQueryData(POST_RQKEY(node.post.uri), node.post)
    if (node.parent) {
      hydrateCache(queryClient, node.parent)
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        hydrateCache(queryClient, reply)
      }
    }
  } else if (
    AppBskyFeedDefs.isBlockedPost(node) ||
    AppBskyFeedDefs.isNotFoundPost(node)
  ) {
    queryClient.setQueryData(POST_RQKEY(node.uri), undefined)
  }
}
