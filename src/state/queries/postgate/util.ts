import {
  type $Typed,
  AppBskyEmbedRecord as AppGndrEmbedRecord,
  AppBskyEmbedRecordWithMedia as AppGndrEmbedRecordWithMedia,
  type AppBskyFeedDefs as AppGndrFeedDefs,
  type AppBskyFeedPostgate as AppGndrFeedPostgate,
  AtUri,
} from '@atproto/api'

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

export function createPostgateRecord(
  postgate: Partial<AppGndrFeedPostgate.Record> & {
    post: AppGndrFeedPostgate.Record['post']
  },
): AppGndrFeedPostgate.Record {
  return {
    $type: POSTGATE_COLLECTION,
    createdAt: new Date().toISOString(),
    post: postgate.post,
    detachedEmbeddingUris: postgate.detachedEmbeddingUris || [],
    embeddingRules: postgate.embeddingRules || [],
  }
}

export function mergePostgateRecords(
  prev: AppGndrFeedPostgate.Record,
  next: Partial<AppGndrFeedPostgate.Record>,
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
}): $Typed<AppGndrEmbedRecord.View> {
  const record: $Typed<AppGndrEmbedRecord.ViewDetached> = {
    $type: 'app.bsky.embedrecord#viewDetached',
    uri,
    detached: true,
  }
  return {
    $type: 'app.bsky.embedrecord#view',
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
      post: AppGndrFeedDefs.PostView
      quote: AppGndrFeedDefs.PostView
      quoteUri: undefined
      detached: false
    }
  | {
      post: AppGndrFeedDefs.PostView
      quote: undefined
      quoteUri: string
      detached: true
    }): AppGndrEmbedRecord.View | AppGndrEmbedRecordWithMedia.View | undefined {
  if (AppGndrEmbedRecord.isView(post.embed)) {
    if (detached) {
      return createEmbedViewDetachedRecord({uri: quoteUri})
    } else {
      return createEmbedRecordView({post: quote})
    }
  } else if (AppGndrEmbedRecordWithMedia.isView(post.embed)) {
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
  post: AppGndrFeedDefs.PostView,
): $Typed<AppGndrEmbedRecord.ViewRecord> {
  return {
    $type: 'app.bsky.embedrecord#viewRecord',
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
  post: AppGndrFeedDefs.PostView
}): AppGndrEmbedRecord.View {
  return {
    $type: 'app.bsky.embedrecord#view',
    record: createEmbedViewRecordFromPost(post),
  }
}

export function createEmbedRecordWithMediaView({
  post,
  quote,
}: {
  post: AppGndrFeedDefs.PostView
  quote: AppGndrFeedDefs.PostView
}): AppGndrEmbedRecordWithMedia.View | undefined {
  if (!AppGndrEmbedRecordWithMedia.isView(post.embed)) return
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
  post: AppGndrFeedDefs.PostView
}) {
  if (AppGndrEmbedRecord.isView(post.embed)) {
    // detached
    if (AppGndrEmbedRecord.isViewDetached(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (AppGndrEmbedRecord.isViewRecord(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: false,
      }
    }
  } else if (AppGndrEmbedRecordWithMedia.isView(post.embed)) {
    // detached
    if (AppGndrEmbedRecord.isViewDetached(post.embed.record.record)) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (AppGndrEmbedRecord.isViewRecord(post.embed.record.record)) {
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
