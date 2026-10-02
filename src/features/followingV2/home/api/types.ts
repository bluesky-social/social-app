import {type app} from '#/lexicons'

/**
 * Which feed a page continues from, for feed APIs that switch between several.
 * Only Home uses it, for its Following-to-Discover fallback (see
 * `HomeFeedAPI`).
 */
export type FeedSource = 'discover'

export interface FeedAPIResponse {
  cursor?: string
  /** The source the next page continues from. */
  source?: FeedSource
  feed: app.bsky.feed.defs.FeedViewPost[]
}

/**
 * Feed APIs hold no state between pages: everything a fetch needs is in its
 * arguments, so a fresh instance can fetch any page.
 */
export interface FeedAPI {
  /** The feed's newest post, if it has one. */
  peekLatest(opts?: {
    source?: FeedSource
  }): Promise<app.bsky.feed.defs.FeedViewPost | undefined>
  fetch({
    cursor,
    source,
    limit,
    signal,
  }: {
    cursor: string | undefined
    source?: FeedSource
    limit: number
    signal?: AbortSignal
  }): Promise<FeedAPIResponse>
}

export interface ReasonFeedSource {
  $type: 'reasonFeedSource'
  uri: string
  href: string
}

export function isReasonFeedSource(v: unknown): v is ReasonFeedSource {
  return (
    !!v &&
    typeof v === 'object' &&
    '$type' in v &&
    v.$type === 'reasonFeedSource'
  )
}
