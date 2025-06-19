import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  AtUri,
} from '@atproto/api'

import {
  type ApiThreadItem,
  type ThreadItem,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'
import {isDevMode} from '#/storage/hooks/dev-mode'
import * as bsky from '#/types/bsky'

export function getThreadgateRecord(
  view: AppBskyUnspeccedGetPostThreadV2.OutputSchema['threadgate'],
) {
  return bsky.dangerousIsType<AppBskyFeedThreadgate.Record>(
    view?.record,
    AppBskyFeedThreadgate.isRecord,
  )
    ? view?.record
    : undefined
}

export function getRootPostAtUri(post: AppBskyFeedDefs.PostView) {
  if (
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    if (post.record.reply?.root?.uri) {
      return new AtUri(post.record.reply.root.uri)
    }
  }
}

export function getPostRecord(post: AppBskyFeedDefs.PostView) {
  return post.record as AppBskyFeedPost.Record
}

export function getTraversalMetadata({
  item,
  prevItem,
  nextItem,
  parentMetadata,
}: {
  item: ApiThreadItem
  prevItem?: ApiThreadItem
  nextItem?: ApiThreadItem
  parentMetadata?: TraversalMetadata
}): TraversalMetadata {
  if (!AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
    throw new Error(`Expected thread item to be a post`)
  }
  const repliesCount = item.value.post.replyCount || 0
  const repliesUnhydrated = item.value.moreReplies || 0
  const metadata = {
    depth: item.depth,
    /*
     * Unknown until after traversal
     */
    isLastChild: false,
    /*
     * Unknown until after traversal
     */
    isLastSibling: false,
    /*
     * If it's a top level reply, bc we render each top-level branch as a
     * separate tree, it's implicitly part of the last branch. For subsequent
     * replies, we'll override this after traversal.
     */
    isPartOfLastBranchFromDepth: item.depth === 1 ? 1 : undefined,
    nextItemDepth: nextItem?.depth,
    parentMetadata,
    prevItemDepth: prevItem?.depth,
    /*
     * Unknown until after traversal
     */
    precedesChildReadMore: false,
    /*
     * Unknown until after traversal
     */
    followsReadMoreUp: false,
    postData: {
      uri: item.uri,
      authorHandle: item.value.post.author.handle,
    },
    repliesCount,
    repliesUnhydrated,
    repliesSeenCounter: 0,
    repliesIndexCounter: 0,
    replyIndex: 0,
    skippedIndentIndices: new Set<number>(),
  }

  if (isDevMode()) {
    // @ts-ignore dev only for debugging
    metadata.postData.text = getPostRecord(item.value.post).text
  }

  return metadata
}

export function storeTraversalMetadata(
  metadatas: Map<string, TraversalMetadata>,
  metadata: TraversalMetadata,
) {
  metadatas.set(metadata.postData.uri, metadata)

  if (isDevMode()) {
    // @ts-ignore dev only for debugging
    metadatas.set(metadata.postData.text, metadata)
    // @ts-ignore
    window.__thread = metadatas
  }
}

export function getThreadPostUI({
  depth,
  repliesCount,
  prevItemDepth,
  isLastChild,
  skippedIndentIndices,
  repliesSeenCounter,
  repliesUnhydrated,
  precedesChildReadMore,
  followsReadMoreUp,
}: TraversalMetadata): Extract<ThreadItem, {type: 'threadPost'}>['ui'] {
  const isReplyAndHasReplies =
    depth > 0 &&
    repliesCount > 0 &&
    (repliesCount - repliesUnhydrated === repliesSeenCounter ||
      repliesSeenCounter > 0)
  return {
    isAnchor: depth === 0,
    showParentReplyLine:
      followsReadMoreUp ||
      (!!prevItemDepth && prevItemDepth !== 0 && prevItemDepth < depth),
    showChildReplyLine: depth < 0 || isReplyAndHasReplies,
    indent: depth,
    /*
     * If there are no slices below this one, or the next slice has a depth <=
     * than the depth of this post, it's the last child of the reply tree. It
     * is not necessarily the last leaf in the parent branch, since it could
     * have another sibling.
     */
    isLastChild,
    skippedIndentIndices,
    precedesChildReadMore: precedesChildReadMore ?? false,
  }
}

export function getThreadPostNoUnauthenticatedUI({
  depth,
  prevItemDepth,
}: {
  depth: number
  prevItemDepth?: number
  nextItemDepth?: number
}): Extract<ThreadItem, {type: 'threadPostNoUnauthenticated'}>['ui'] {
  return {
    showChildReplyLine: depth < 0,
    showParentReplyLine: Boolean(prevItemDepth && prevItemDepth < depth),
  }
}
