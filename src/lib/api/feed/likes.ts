import {
  AppBskyFeedDefs,
  AppBskyFeedGetActorLikes as GetActorLikes,
  BskyAgent,
} from '@atproto/api'

import {FeedAPI, FeedAPIResponse} from './types'

export class LikesFeedAPI implements FeedAPI {
  getAgent: () => BskyAgent
  params: GetActorLikes.QueryParams

  constructor({
    getAgent,
    feedParams,
  }: {
    getAgent: () => BskyAgent
    feedParams: GetActorLikes.QueryParams
  }) {
    this.getAgent = getAgent
    this.params = feedParams
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.getAgent().getActorLikes({
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
    const res = await this.getAgent().getActorLikes({
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
