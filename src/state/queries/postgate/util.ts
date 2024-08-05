import {AppBskyFeedPostgate} from '@atproto/api'
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
