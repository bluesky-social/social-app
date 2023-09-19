import {AppBskyFeedDefs} from '@atproto/api'

export interface FeedAPIResponse {
  cursor?: string
  feed: AppBskyFeedDefs.FeedViewPost[]
}

export interface FeedAPI {
  reset(): void
  peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost>
  fetchNext({limit}: {limit: number}): Promise<FeedAPIResponse>
}

export interface FeedSourceInfo {
  uri: string
  displayName: string
}
