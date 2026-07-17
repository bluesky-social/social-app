import {type Client} from '@atproto/lex-client'

import {type app} from '#/lexicons'

export interface FeedAPIResponse {
  cursor?: string
  feed: app.bsky.feed.defs.FeedViewPost[]
}

export interface FeedAPI {
  /**
   * Swap in a fresh client. Feed pages retain their FeedAPI across paginations,
   * so the client captured at construction goes stale after a session-bundle
   * rebuild (web cross-tab token sync). Callers re-point the api at the current
   * client before each fetch/peek so a disposed client is never used.
   */
  setClient(client: Client): void
  peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost>
  fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
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
