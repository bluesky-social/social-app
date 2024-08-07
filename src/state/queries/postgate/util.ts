import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPostgate,
  AtUri,
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

export function getMaybeDetachedQuoteEmbed({
  viewerDid,
  post,
}: {
  viewerDid: string
  post: AppBskyFeedDefs.PostView
}) {
  if (AppBskyEmbedRecord.isView(post.embed)) {
    // detached
    if (AppBskyEmbedRecord.isViewRemoved(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (AppBskyEmbedRecord.isViewRecord(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: false,
      }
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    // detached
    if (AppBskyEmbedRecord.isViewRemoved(post.embed.record.record)) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (AppBskyEmbedRecord.isViewRecord(post.embed.record.record)) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: false,
      }
    }
  }
}
