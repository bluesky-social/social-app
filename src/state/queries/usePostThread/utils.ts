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

export function getPostTraversalMetadata(
  item: Extract<Slice, {type: 'threadPost'}>,
): TraversalMetadata | undefined {
  if (!AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) return
  const replyCount = item.value.post.replyCount || 0
  const unhydratedReplies = item.value.moreReplies || 0
  return {
    indent: item.ui.indent,
    /**
     * If the post has more than a single reply, and the total reply count
     * minus the number of replies not present in the response is greater than
     * 1, then we must have more than a single branch of replies present in the
     * response, which can affect how we render tree view.
     */
    hasBranchingReplies: replyCount > 1 && replyCount - unhydratedReplies > 1,
  }
}
