import {
  AppBskyFeedDefs,
  AppBskyFeedGetActorLikes as GetActorLikes,
} from '@atproto/api'

import {getAgent} from '#/state/session'

import {FeedAPI, FeedAPIResponse} from './types'

export class LikesFeedAPI implements FeedAPI {
  constructor(public params: GetActorLikes.QueryParams) {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await getAgent().getActorLikes({
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
    const res = await getAgent().getActorLikes({
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
