import {
  type $Typed,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type AppBskyFeedPostgate,
  AtUri,
} from '@atproto/api'

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

export function createPostgateRecord(
  postgate: Partial<AppBskyFeedPostgate.Record> & {
    post: AppBskyFeedPostgate.Record['post']
  },
): AppBskyFeedPostgate.Record {
  return {
    $type: POSTGATE_COLLECTION,
    createdAt: new Date().toISOString(),
    post: postgate.post,
    detachedEmbeddingUris: postgate.detachedEmbeddingUris || [],
    embeddingRules: postgate.embeddingRules || [],
  }
}

export function mergePostgateRecords(
  prev: AppBskyFeedPostgate.Record,
  next: Partial<AppBskyFeedPostgate.Record>,
) {
  const detachedEmbeddingUris = Array.from(
    new Set([
      ...(prev.detachedEmbeddingUris || []),
      ...(next.detachedEmbeddingUris || []),
    ]),
  )
  const embeddingRules = [
    ...(prev.embeddingRules || []),
    ...(next.embeddingRules || []),
  ].filter(
    (rule, i, all) => all.findIndex(_rule => _rule.$type === rule.$type) === i,
  )
  return createPostgateRecord({
    post: prev.post,
    detachedEmbeddingUris,
    embeddingRules,
  })
}

export function createEmbedViewDetachedRecord({
  uri,
}: {
  uri: string
}): $Typed<AppBskyEmbedRecord.View> {
  const record: $Typed<AppBskyEmbedRecord.ViewDetached> = {
    $type: 'app.bsky.embed.record#viewDetached',
    uri,
    detached: true,
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
      return createEmbedViewDetachedRecord({uri: quoteUri})
    } else {
      return createEmbedRecordView({post: quote})
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    if (detached) {
      return {
        ...post.embed,
        record: createEmbedViewDetachedRecord({uri: quoteUri}),
      }
    } else {
      return createEmbedRecordWithMediaView({post, quote})
    }
  }
}

export function createEmbedViewRecordFromPost(
  post: AppBskyFeedDefs.PostView,
): $Typed<AppBskyEmbedRecord.ViewRecord> {
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
    quoteCount: post.quoteCount,
    indexedAt: post.indexedAt,
    embeds: post.embed ? [post.embed] : [],
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
    if (AppBskyEmbedRecord.isViewDetached(post.embed.record)) {
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
    if (AppBskyEmbedRecord.isViewDetached(post.embed.record.record)) {
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

export const embeddingRules = {
  disableRule: {$type: 'app.bsky.feed.postgate#disableRule'},
}
