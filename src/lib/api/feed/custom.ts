import {
  AppBskyFeedDefs,
  AppBskyFeedGetFeed as GetCustomFeed,
} from '@atproto/api'
import {RootStoreModel} from 'state/index'
import {FeedAPI, FeedAPIResponse} from './types'

export class CustomFeedAPI implements FeedAPI {
  cursor: string | undefined

  constructor(
    public rootStore: RootStoreModel,
    public params: GetCustomFeed.QueryParams,
  ) {}

  reset() {
    this.cursor = undefined
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.rootStore.agent.app.bsky.feed.getFeed({
      ...this.params,
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetchNext({limit}: {limit: number}): Promise<FeedAPIResponse> {
    const res = await this.rootStore.agent.app.bsky.feed.getFeed({
      ...this.params,
      cursor: this.cursor,
      limit,
    })
    if (res.success) {
      this.cursor = res.data.cursor
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      return {
        cursor: res.data.cursor,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}
