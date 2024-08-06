import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPostgate,
} from '@atproto/api'
import {ViewRemoved} from '@atproto/api/dist/client/types/app/bsky/embed/record'

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

export function createPostgateRecord(
  postgate: Partial<AppBskyFeedPostgate.Record>,
): AppBskyFeedPostgate.Record {
  if (!postgate.post) {
    throw new Error(`Cannot create a postgate record without a post URI`)
  }

  return {
    $type: POSTGATE_COLLECTION,
    createdAt: new Date().toISOString(),
    post: postgate.post,
    detachedQuotes: postgate.detachedQuotes || [],
  }
}

export function mergePostgateRecords(
  prev: AppBskyFeedPostgate.Record,
  next: Partial<AppBskyFeedPostgate.Record>,
) {
  const detachedQuotes = Array.from(
    new Set([...(prev.detachedQuotes || []), ...(next.detachedQuotes || [])]),
  )
  return createPostgateRecord({
    post: prev.post,
    detachedQuotes,
  })
}

export function createEmbedViewRemovedRecord({uri}: {uri: string}) {
  const record: ViewRemoved = {
    $type: 'app.bsky.embed.record#viewRemoved',
    uri,
    removed: true,
  }
  return {
    $type: 'app.bsky.embed.record#view',
    record,
  }
}

export function createEmbed({
  post,
  embeddedPost,
  detached,
}: {
  post: AppBskyFeedDefs.PostView
  embeddedPost: AppBskyFeedDefs.PostView
  detached: boolean
}) {
  if (AppBskyEmbedRecord.isView(post.embed)) {
    if (detached) return createEmbedViewRemovedRecord({uri: embeddedPost.uri})
    return createEmbedRecordView({post: embeddedPost})
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    if (detached)
      return {
        ...post.embed,
        record: createEmbedViewRemovedRecord({uri: embeddedPost.uri}),
      }
    return createEmbedRecordWithmediaView({post, embeddedPost})
  }
}

export function createEmbedRecordView({
  post,
}: {
  post: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecord.View {
  return {
    $type: 'app.bsky.embed.record#view',
    record: {
      $type: 'app.bsky.embed.record#viewRecord',
      ...post,
      value: post.record,
    },
  }
}

export function createEmbedRecordWithmediaView({
  post,
  embeddedPost,
}: {
  post: AppBskyFeedDefs.PostView
  embeddedPost: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecordWithMedia.View | undefined {
  if (!AppBskyEmbedRecordWithMedia.isView(post.embed)) return
  return {
    ...(post.embed || {}),
    record: {
      record: {
        $type: 'app.bsky.embed.record#viewRecord',
        ...embeddedPost,
        value: embeddedPost.record,
      },
    },
  }
}
