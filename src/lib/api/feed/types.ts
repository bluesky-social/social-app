import {type app} from '#/lexicons'

export interface FeedAPIResponse {
  cursor?: string
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
