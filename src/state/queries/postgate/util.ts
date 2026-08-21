import {type $Typed} from '@atproto/lex'
import {AtUri, type AtUriString, toDatetimeString} from '@atproto/syntax'

import * as AppBskyEmbedRecord from '#/lexicons/app/bsky/embed/record'
import * as AppBskyEmbedRecordWithMedia from '#/lexicons/app/bsky/embed/recordWithMedia'
import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import type * as AppBskyFeedPostgate from '#/lexicons/app/bsky/feed/postgate'
import * as bsky from '#/types/bsky'

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

/**
 * Create a new {@link app.bsky.feed.postgate.Main}. URIs are accepted as plain
 * strings (callers hold raw AT-URIs) and asserted to the branded `AtUriString`
 * here.
 */
export function createPostgateRecord(
  postgate: Omit<
    Partial<AppBskyFeedPostgate.Main>,
    'post' | 'detachedEmbeddingUris'
  > & {
    post: string
    detachedEmbeddingUris?: string[]
  },
): AppBskyFeedPostgate.Main {
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
  prev: AppBskyFeedPostgate.Main,
  next: Omit<Partial<AppBskyFeedPostgate.Main>, 'detachedEmbeddingUris'> & {
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
      quoteUri: AtUriString
      detached: true
    }): AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined {
  if (bsky.isType(AppBskyEmbedRecord.view, post.embed)) {
    if (detached) {
      return createEmbedViewDetachedRecord({uri: quoteUri})
    } else {
      return createEmbedRecordView({post: quote})
    }
  } else if (bsky.isType(AppBskyEmbedRecordWithMedia.view, post.embed)) {
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
  if (!bsky.isType(AppBskyEmbedRecordWithMedia.view, post.embed)) return
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
  if (bsky.isType(AppBskyEmbedRecord.view, post.embed)) {
    // detached
    if (bsky.isType(AppBskyEmbedRecord.viewDetached, post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: true,
      }
    }

    // post
    if (bsky.isType(AppBskyEmbedRecord.viewRecord, post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid,
        isDetached: false,
      }
    }
  } else if (bsky.isType(AppBskyEmbedRecordWithMedia.view, post.embed)) {
    // detached
    if (
      bsky.isType(AppBskyEmbedRecord.viewDetached, post.embed.record.record)
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
    if (bsky.isType(AppBskyEmbedRecord.viewRecord, post.embed.record.record)) {
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
