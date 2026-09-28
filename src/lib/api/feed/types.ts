import {type app} from '#/lexicons'

export interface FeedAPIResponse {
  cursor?: string
  /**
   * The server's cursor for the newest boundary of this response, from
   * `getTimeline`. Absent from other feeds, and from appviews that predate it.
   */
  startCursor?: string
  feed: app.bsky.feed.defs.FeedViewPost[]
}

export interface FeedAPI {
  peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost>
  fetch({
    cursor,
    limit,
    signal,
  }: {
    cursor: string | undefined
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
