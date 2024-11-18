import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  ModerationOpts,
} from '@atproto/api'
import {QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {
  findAllPostsInQueryData as findAllPostsInSearchQueryData,
  findAllProfilesInQueryData as findAllProfilesInSearchQueryData,
} from '#/state/queries/search-posts'
import {useAgent} from '#/state/session'
import {
  findAllPostsInQueryData as findAllPostsInNotifsQueryData,
  findAllProfilesInQueryData as findAllProfilesInNotifsQueryData,
} from './notifications/feed'
import {
  findAllPostsInQueryData as findAllPostsInFeedQueryData,
  findAllProfilesInQueryData as findAllProfilesInFeedQueryData,
} from './post-feed'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

const REPLY_TREE_DEPTH = 10
export const RQKEY_ROOT = 'post-thread'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]
type ThreadViewNode = AppBskyFeedGetPostThread.OutputSchema['thread']

export interface ThreadCtx {
  depth: number
  isHighlightedPost?: boolean
  hasMore?: boolean
  isParentLoading?: boolean
  isChildLoading?: boolean
  isSelfThread?: boolean
  hasMoreSelfThread?: boolean
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

export type ThreadModerationCache = WeakMap<ThreadNode, ModerationDecision>

export type PostThreadQueryData = {
  thread: ThreadNode
  threadgate?: AppBskyFeedDefs.ThreadgateView
}

export function usePostThreadQuery(uri: string | undefined) {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useQuery<PostThreadQueryData, Error>({
    gcTime: 0,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const res = await agent.getPostThread({
        uri: uri!,
        depth: REPLY_TREE_DEPTH,
      })
      if (res.success) {
        const thread = responseToThreadNodes(res.data.thread)
        annotateSelfThread(thread)
        return {
          thread,
          threadgate: res.data.threadgate as
            | AppBskyFeedDefs.ThreadgateView
            | undefined,
        }
      }
      return {thread: {type: 'unknown', uri: uri!}}
    },
    enabled: !!uri,
    placeholderData: () => {
      if (!uri) return
      const post = findPostInQueryData(queryClient, uri)
      if (post) {
        return {thread: post}
      }
      return undefined
    },
  })
}

export function fillThreadModerationCache(
  cache: ThreadModerationCache,
  node: ThreadNode,
  moderationOpts: ModerationOpts,
) {
  if (node.type === 'post') {
    cache.set(node, moderatePost(node.post, moderationOpts))
    if (node.parent) {
      fillThreadModerationCache(cache, node.parent, moderationOpts)
    }
    if (node.replies) {
      for (const reply of node.replies) {
        fillThreadModerationCache(cache, reply, moderationOpts)
      }
    }
  }
}

export function sortThread(
  node: ThreadNode,
  opts: UsePreferencesQueryResponse['threadViewPrefs'],
  modCache: ThreadModerationCache,
  currentDid: string | undefined,
  justPostedUris: Set<string>,
  threadgateRecordHiddenReplies: Set<string>,
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

      if (node.ctx.isHighlightedPost || opts.lab_treeViewEnabled) {
        const aIsJustPosted =
          a.post.author.did === currentDid && justPostedUris.has(a.post.uri)
        const bIsJustPosted =
          b.post.author.did === currentDid && justPostedUris.has(b.post.uri)
        if (aIsJustPosted && bIsJustPosted) {
          return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
        } else if (aIsJustPosted) {
          return -1 // reply while onscreen
        } else if (bIsJustPosted) {
          return 1 // reply while onscreen
        }
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

      const aIsBySelf = a.post.author.did === currentDid
      const bIsBySelf = b.post.author.did === currentDid
      if (aIsBySelf && bIsBySelf) {
        return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
      } else if (aIsBySelf) {
        return -1 // current account's reply
      } else if (bIsBySelf) {
        return 1 // current account's reply
      }

      const aHidden = threadgateRecordHiddenReplies.has(a.uri)
      const bHidden = threadgateRecordHiddenReplies.has(b.uri)
      if (aHidden && !aIsBySelf && !bHidden) {
        return 1
      } else if (bHidden && !bIsBySelf && !aHidden) {
        return -1
      }

      const aBlur = Boolean(modCache.get(a)?.ui('contentList').blur)
      const bBlur = Boolean(modCache.get(b)?.ui('contentList').blur)
      if (aBlur !== bBlur) {
        if (aBlur) {
          return 1
        }
        if (bBlur) {
          return -1
        }
      }

      const aPin = Boolean(a.record.text.trim() === '📌')
      const bPin = Boolean(b.record.text.trim() === '📌')
      if (aPin !== bPin) {
        if (aPin) {
          return 1
        }
        if (bPin) {
          return -1
        }
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
    node.replies.forEach(reply =>
      sortThread(
        reply,
        opts,
        modCache,
        currentDid,
        justPostedUris,
        threadgateRecordHiddenReplies,
      ),
    )
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
        isSelfThread: false, // populated `annotateSelfThread`
        hasMoreSelfThread: false, // populated in `annotateSelfThread`
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

function annotateSelfThread(thread: ThreadNode) {
  if (thread.type !== 'post') {
    return
  }
  const selfThreadNodes: ThreadPost[] = [thread]

  let parent: ThreadNode | undefined = thread.parent
  while (parent) {
    if (
      parent.type !== 'post' ||
      parent.post.author.did !== thread.post.author.did
    ) {
      // not a self-thread
      return
    }
    selfThreadNodes.unshift(parent)
    parent = parent.parent
  }

  let node = thread
  for (let i = 0; i < 10; i++) {
    const reply = node.replies?.find(
      r => r.type === 'post' && r.post.author.did === thread.post.author.did,
    )
    if (reply?.type !== 'post') {
      break
    }
    selfThreadNodes.push(reply)
    node = reply
  }

  if (selfThreadNodes.length > 1) {
    for (const selfThreadNode of selfThreadNodes) {
      selfThreadNode.ctx.isSelfThread = true
    }
    const last = selfThreadNodes[selfThreadNodes.length - 1]
    if (
      last &&
      last.ctx.depth === REPLY_TREE_DEPTH && // at the edge of the tree depth
      last.post.replyCount && // has replies
      !last.replies?.length // replies were not hydrated
    ) {
      last.ctx.hasMoreSelfThread = true
    }
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
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<PostThreadQueryData>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    const {thread} = queryData
    for (const item of traverseThread(thread)) {
      if (item.type === 'post' && didOrHandleUriMatches(atUri, item.post)) {
        const placeholder = threadNodeToPlaceholderThread(item)
        if (placeholder) {
          yield placeholder
        }
      }
      const quotedPost =
        item.type === 'post' ? getEmbeddedPost(item.post.embed) : undefined
      if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
        yield embedViewRecordToPlaceholderThread(quotedPost)
      }
    }
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    // Check notifications first. If you have a post in notifications,
    // it's often due to a like or a repost, and we want to prioritize
    // a post object with >0 likes/reposts over a stale version with no
    // metrics in order to avoid a notification->post scroll jump.
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<PostThreadQueryData>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    const {thread} = queryData
    for (const item of traverseThread(thread)) {
      if (item.type === 'post' && item.post.author.did === did) {
        yield item.post.author
      }
      const quotedPost =
        item.type === 'post' ? getEmbeddedPost(item.post.embed) : undefined
      if (quotedPost?.author.did === did) {
        yield quotedPost?.author
      }
    }
  }
  for (let profile of findAllProfilesInFeedQueryData(queryClient, did)) {
    yield profile
  }
  for (let profile of findAllProfilesInNotifsQueryData(queryClient, did)) {
    yield profile
  }
  for (let profile of findAllProfilesInSearchQueryData(queryClient, did)) {
    yield profile
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
      isParentLoading: !!(record.value as AppBskyFeedPost.Record).reply,
      isChildLoading: true, // not available, so assume yes (to show the spinner)
    },
  }
}
