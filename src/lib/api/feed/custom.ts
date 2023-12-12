import {
  AppBskyFeedDefs,
  AppBskyFeedGetFeed as GetCustomFeed,
} from '@atproto/api'
import {FeedAPI, FeedAPIResponse} from './types'
import {getAgent} from '#/state/session'

export class CustomFeedAPI implements FeedAPI {
  constructor(public params: GetCustomFeed.QueryParams) {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await getAgent().app.bsky.feed.getFeed({
      ...this.params,
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await getAgent().app.bsky.feed.getFeed({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      return {
        cursor: res.data.feed.length ? res.data.cursor : undefined,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}
