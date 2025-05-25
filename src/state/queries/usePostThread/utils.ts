import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  type AppBskyUnspeccedGetPostThreadV2,
  AtUri,
} from '@atproto/api'

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
