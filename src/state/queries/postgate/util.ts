import {type $Typed} from '@atproto/lex'
import {AtUri, type AtUriString, toDatetimeString} from '@atproto/syntax'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

/**
 * Create a new {@link app.bsky.feed.postgate.Main}. URIs are accepted as plain
 * strings (callers hold raw AT-URIs) and asserted to the branded `AtUriString`
 * here.
 */
export function createPostgateRecord(
  postgate: Omit<
    Partial<app.bsky.feed.postgate.Main>,
    'post' | 'detachedEmbeddingUris'
  > & {
    post: string
    detachedEmbeddingUris?: string[]
  },
): app.bsky.feed.postgate.Main {
  return {
    $type: POSTGATE_COLLECTION,
    createdAt: toDatetimeString(new Date()),
    post: postgate.post as AtUriString,
    detachedEmbeddingUris: (postgate.detachedEmbeddingUris ||
      []) as AtUriString[],
    embeddingRules: postgate.embeddingRules || [],
  }
}

export function mergePostgateRecords(
  prev: app.bsky.feed.postgate.Main,
  next: Omit<Partial<app.bsky.feed.postgate.Main>, 'detachedEmbeddingUris'> & {
    detachedEmbeddingUris?: string[]
  },
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
  uri: AtUriString
}): $Typed<app.bsky.embed.record.View> {
  const record: $Typed<app.bsky.embed.record.ViewDetached> = {
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
      post: app.bsky.feed.defs.PostView
      quote: app.bsky.feed.defs.PostView
      quoteUri: undefined
      detached: false
    }
  | {
      post: app.bsky.feed.defs.PostView
      quote: undefined
      quoteUri: AtUriString
      detached: true
    }):
  app.bsky.embed.record.View | app.bsky.embed.recordWithMedia.View | undefined {
  if (bsky.isType(app.bsky.embed.record.view, post.embed)) {
    if (detached) {
      return createEmbedViewDetachedRecord({uri: quoteUri})
    } else {
      return createEmbedRecordView({post: quote})
    }
  } else if (bsky.isType(app.bsky.embed.recordWithMedia.view, post.embed)) {
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
  post: app.bsky.feed.defs.PostView,
): $Typed<app.bsky.embed.record.ViewRecord> {
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
  post: app.bsky.feed.defs.PostView
}): app.bsky.embed.record.View {
  return {
    $type: 'app.bsky.embed.record#view',
    record: createEmbedViewRecordFromPost(post),
  }
}

export function createEmbedRecordWithMediaView({
  post,
  quote,
}: {
  post: app.bsky.feed.defs.PostView
  quote: app.bsky.feed.defs.PostView
}): app.bsky.embed.recordWithMedia.View | undefined {
  if (!bsky.isType(app.bsky.embed.recordWithMedia.view, post.embed)) return
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
  post: app.bsky.feed.defs.PostView
}) {
  if (bsky.isType(app.bsky.embed.record.view, post.embed)) {
    // detached
    if (bsky.isType(app.bsky.embed.record.viewDetached, post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (bsky.isType(app.bsky.embed.record.viewRecord, post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: false,
      }
    }
  } else if (bsky.isType(app.bsky.embed.recordWithMedia.view, post.embed)) {
    // detached
    if (
      bsky.isType(app.bsky.embed.record.viewDetached, post.embed.record.record)
    ) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (
      bsky.isType(app.bsky.embed.record.viewRecord, post.embed.record.record)
    ) {
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
  disableRule: {$type: 'app.bsky.feed.postgate#disableRule'} as const,
}
