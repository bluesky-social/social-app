import {
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  AppBskyFeedPost,
} from '@atproto/api'
import {QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useAgent} from '#/state/session'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from 'state/queries/search-posts'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from './notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from './post-feed'
import {embedViewRecordToPostView, getEmbeddedPost} from './util'

const RQKEY_ROOT = 'post-thread'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]
type ThreadViewNode = AppBskyFeedGetPostThread.OutputSchema['thread']

export interface ThreadCtx {
  depth: number
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
  isParentLoading?: boolean
  isChildLoading?: boolean
}

export type ThreadPost = {
  type: 'post'
  _reactKey: string
  uri: string
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  parent?: ThreadNode
  replies?: ThreadNode[]
  ctx: ThreadCtx
}

export type ThreadNotFound = {
  type: 'not-found'
  _reactKey: string
  uri: string
  ctx: ThreadCtx
}

export type ThreadBlocked = {
  type: 'blocked'
  _reactKey: string
  uri: string
  ctx: ThreadCtx
}

export type ThreadUnknown = {
  type: 'unknown'
  uri: string
}

export type ThreadNode =
  | ThreadPost
  | ThreadNotFound
  | ThreadBlocked
  | ThreadUnknown

export function usePostThreadQuery(uri: string | undefined) {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()
  return useQuery<ThreadNode, Error>({
    gcTime: 0,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const res = await getAgent().getPostThread({uri: uri!})
      if (res.success) {
        return responseToThreadNodes(res.data.thread)
      }
      return {type: 'unknown', uri: uri!}
    },
    enabled: !!uri,
    placeholderData: () => {
      if (!uri) {
        return undefined
      }
      {
        const post = findPostInQueryData(queryClient, uri)
        if (post) {
          return post
        }
      }
      return undefined
    },
  })
}

export function sortThread(
  node: ThreadNode,
  opts: UsePreferencesQueryResponse['threadViewPrefs'],
): ThreadNode {
  if (node.type !== 'post') {
    return node
  }
  if (node.replies) {
    node.replies.sort((a: ThreadNode, b: ThreadNode) => {
      if (a.type !== 'post') {
        return 1
      }
      if (b.type !== 'post') {
        return -1
      }

      const aIsByOp = a.post.author.did === node.post?.author.did
      const bIsByOp = b.post.author.did === node.post?.author.did
      if (aIsByOp && bIsByOp) {
        return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
      } else if (aIsByOp) {
        return -1 // op's own reply
      } else if (bIsByOp) {
        return 1 // op's own reply
      }
      if (opts.prioritizeFollowedUsers) {
        const af = a.post.author.viewer?.following
        const bf = b.post.author.viewer?.following
        if (af && !bf) {
          return -1
        } else if (!af && bf) {
          return 1
        }
      }
      if (opts.sort === 'oldest') {
        return a.post.indexedAt.localeCompare(b.post.indexedAt)
      } else if (opts.sort === 'newest') {
        return b.post.indexedAt.localeCompare(a.post.indexedAt)
      } else if (opts.sort === 'most-likes') {
        if (a.post.likeCount === b.post.likeCount) {
          return b.post.indexedAt.localeCompare(a.post.indexedAt) // newest
        } else {
          return (b.post.likeCount || 0) - (a.post.likeCount || 0) // most likes
        }
      } else if (opts.sort === 'random') {
        return 0.5 - Math.random() // this is vaguely criminal but we can get away with it
      }
      return b.post.indexedAt.localeCompare(a.post.indexedAt)
    })
    node.replies.forEach(reply => sortThread(reply, opts))
  }
  return node
}

// internal methods
// =

function responseToThreadNodes(
  node: ThreadViewNode,
  depth = 0,
  direction: 'up' | 'down' | 'start' = 'start',
): ThreadNode {
  if (
    AppBskyFeedDefs.isThreadViewPost(node) &&
    AppBskyFeedPost.isRecord(node.post.record) &&
    AppBskyFeedPost.validateRecord(node.post.record).success
  ) {
    const post = node.post
    // These should normally be present. They're missing only for
    // posts that were *just* created. Ideally, the backend would
    // know to return zeros. Fill them in manually to compensate.
    post.replyCount ??= 0
    post.likeCount ??= 0
    post.repostCount ??= 0
    return {
      type: 'post',
      _reactKey: node.post.uri,
      uri: node.post.uri,
      post: post,
      record: node.post.record,
      parent:
        node.parent && direction !== 'down'
          ? responseToThreadNodes(node.parent, depth - 1, 'up')
          : undefined,
      replies:
        node.replies?.length && direction !== 'up'
          ? node.replies
              .map(reply => responseToThreadNodes(reply, depth + 1, 'down'))
              // do not show blocked posts in replies
              .filter(node => node.type !== 'blocked')
          : undefined,
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

function findPostInQueryData(
  queryClient: QueryClient,
  uri: string,
): ThreadNode | void {
  let partial
  for (let item of findAllPostsInQueryData(queryClient, uri)) {
    if (item.type === 'post') {
      // Currently, the backend doesn't send full post info in some cases
      // (for example, for quoted posts). We use missing `likeCount`
      // as a way to detect that. In the future, we should fix this on
      // the backend, which will let us always stop on the first result.
      const hasAllInfo = item.post.likeCount != null
      if (hasAllInfo) {
        return item
      } else {
        partial = item
        // Keep searching, we might still find a full post in the cache.
      }
    }
  }
  return partial
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<ThreadNode, void> {
  const queryDatas = queryClient.getQueriesData<ThreadNode>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const item of traverseThread(queryData)) {
      if (item.uri === uri) {
        const placeholder = threadNodeToPlaceholderThread(item)
        if (placeholder) {
          yield placeholder
        }
      }
      const quotedPost =
        item.type === 'post' ? getEmbeddedPost(item.post.embed) : undefined
      if (quotedPost?.uri === uri) {
        yield embedViewRecordToPlaceholderThread(quotedPost)
      }
    }
  }
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
}

function* traverseThread(node: ThreadNode): Generator<ThreadNode, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* traverseThread(node.parent)
    }
    yield node
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* traverseThread(reply)
      }
    }
  }
}

function threadNodeToPlaceholderThread(
  node: ThreadNode,
): ThreadNode | undefined {
  if (node.type !== 'post') {
    return undefined
  }
  return {
    type: node.type,
    _reactKey: node._reactKey,
    uri: node.uri,
    post: node.post,
    record: node.record,
    parent: undefined,
    replies: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      showChildReplyLine: false,
      showParentReplyLine: false,
      isParentLoading: !!node.record.reply,
      isChildLoading: !!node.post.replyCount,
    },
  }
}

function postViewToPlaceholderThread(
  post: AppBskyFeedDefs.PostView,
): ThreadNode {
  return {
    type: 'post',
    _reactKey: post.uri,
    uri: post.uri,
    post: post,
    record: post.record as AppBskyFeedPost.Record, // validated in notifs
    parent: undefined,
    replies: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      showChildReplyLine: false,
      showParentReplyLine: false,
      isParentLoading: !!(post.record as AppBskyFeedPost.Record).reply,
      isChildLoading: true, // assume yes (show the spinner) just in case
    },
  }
}

function embedViewRecordToPlaceholderThread(
  record: AppBskyEmbedRecord.ViewRecord,
): ThreadNode {
  return {
    type: 'post',
    _reactKey: record.uri,
    uri: record.uri,
    post: embedViewRecordToPostView(record),
    record: record.value as AppBskyFeedPost.Record, // validated in getEmbeddedPost
    parent: undefined,
    replies: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      showChildReplyLine: false,
      showParentReplyLine: false,
      isParentLoading: !!(record.value as AppBskyFeedPost.Record).reply,
      isChildLoading: true, // not available, so assume yes (to show the spinner)
    },
  }
}
