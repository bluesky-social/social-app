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

export function createMaybeDetachedQuoteEmbed({
  post,
  quote,
  quoteUri,
  detached,
}:
  | {
      post: AppBskyFeedDefs.PostView
      quote: AppBskyFeedDefs.PostView
      quoteUri: undefined
      detached: false
    }
  | {
      post: AppBskyFeedDefs.PostView
      quote: undefined
      quoteUri: string
      detached: true
    }): AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined {
  if (AppBskyEmbedRecord.isView(post.embed)) {
    if (detached) {
      return createEmbedViewRemovedRecord({uri: quoteUri})
    } else {
      return createEmbedRecordView({post: quote})
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    if (detached) {
      return {
        ...post.embed,
        record: createEmbedViewRemovedRecord({uri: quoteUri}),
      }
    } else {
      return createEmbedRecordWithMediaView({post, quote})
    }
  }
}

export function createEmbedViewRecordFromPost(
  post: AppBskyFeedDefs.PostView,
): AppBskyEmbedRecord.ViewRecord {
  return {
    $type: 'app.bsky.embed.record#viewRecord',
    uri: post.uri,
    cid: post.cid,
    author: post.author,
    value: post.record,
    labels: post.labels,
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    indexedAt: post.indexedAt,
  }
}

export function createEmbedRecordView({
  post,
}: {
  post: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecord.View {
  return {
    $type: 'app.bsky.embed.record#view',
    record: createEmbedViewRecordFromPost(post),
  }
}

export function createEmbedRecordWithMediaView({
  post,
  quote,
}: {
  post: AppBskyFeedDefs.PostView
  quote: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecordWithMedia.View | undefined {
  if (!AppBskyEmbedRecordWithMedia.isView(post.embed)) return
  return {
    ...(post.embed || {}),
    record: {
      record: createEmbedViewRecordFromPost(quote),
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
