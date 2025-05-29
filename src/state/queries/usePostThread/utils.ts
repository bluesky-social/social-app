import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AppBskyUnspeccedGetPostThreadV2,
  AtUri,
} from '@atproto/api'

import {
  type Slice,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'
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
  item: AppBskyUnspeccedGetPostThreadV2.ThreadItem
  prevItem?: AppBskyUnspeccedGetPostThreadV2.ThreadItem
  nextItem?: AppBskyUnspeccedGetPostThreadV2.ThreadItem
  parentMetadata?: TraversalMetadata
}): TraversalMetadata {
  if (!AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) {
    throw new Error(`Expected thread item to be a post`)
  }
  const replies = item.value.post.replyCount || 0
  const unhydratedReplies = item.value.moreReplies || 0
  /**
   * If the post has more than a single reply, and the total reply count
   * minus the number of replies not present in the response is greater than
   * 1, then we must have more than a single branch of replies present in the
   * response, which can affect how we render tree view.
   */
  const hasBranchingReplies = replies > 1 && replies - unhydratedReplies > 1

  return {
    uri: item.uri,
    depth: item.depth,
    authorHandle: item.value.post.author.handle,
    replies,
    unhydratedReplies,
    seenReplies: 0,
    hasBranchingReplies,
    parentMetadata,
    isLastSibling: false,
    skippedIndents: new Set(),
    prevItemDepth: prevItem?.depth,
    nextItemDepth: nextItem?.depth,
    /*
     * If there are no slices below this one, or the next slice is less
     * indented than the computed indent for this post.
     */
    isDeadEnd: nextItem?.depth === undefined || nextItem?.depth < item.depth,

    upcomingParentReadMore: parentMetadata?.upcomingParentReadMore || undefined,

    // TODO non-spec
    text: getPostRecord(item.value.post).text,
  }
}

export function getThreadPostUI({
  depth,
  replies,
  parentMetadata,
  prevItemDepth,
  isDeadEnd,
  skippedIndents,
  seenReplies,
  unhydratedReplies,
}: TraversalMetadata): Extract<Slice, {type: 'threadPost'}>['ui'] {
  const isReplyAndHasReplies = depth > 0 && replies > 0 && ((replies - unhydratedReplies) === seenReplies || seenReplies > 0)
  return {
    isAnchor: depth === 0,
    showParentReplyLine:
      !!prevItemDepth && prevItemDepth !== 0 && prevItemDepth < depth,
    showChildReplyLine: depth < 0 || isReplyAndHasReplies,
    indent: depth,
    parentHasBranchingReplies: !!parentMetadata?.hasBranchingReplies,
    /*
     * If there are no slices below this one, or the next slice is less
     * indented than the computed indent for this post.
     */
    isDeadEnd, //nextItemDepth === undefined || nextItemDepth < depth,
    skippedIndents,
  }
}
