import {
  AppBskyFeedDefs,
  AppBskyFeedGetListFeed as GetListFeed,
  BskyAgent,
} from '@atproto/api'

import {FeedAPI, FeedAPIResponse} from './types'

export class ListFeedAPI implements FeedAPI {
  agent: BskyAgent
  params: GetListFeed.QueryParams

  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgent
    feedParams: GetListFeed.QueryParams
  }) {
    this.agent = agent
    this.params = feedParams
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.app.bsky.feed.getListFeed({
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
    const res = await this.agent.app.bsky.feed.getListFeed({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
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
