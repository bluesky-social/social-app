import {type AppGndrFeedDefs} from '@gander-social-atproto/api'

export interface FeedAPIResponse {
  cursor?: string
  feed: AppGndrFeedDefs.FeedViewPost[]
}

export interface FeedAPI {
  peekLatest(): Promise<AppGndrFeedDefs.FeedViewPost>
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
