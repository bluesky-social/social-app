import {
  type AppBskyFeedDefs,
  type AppBskyFeedGetActorLikes as GetActorLikes,
} from '@atproto/api'

import {type SessionAgent} from '#/state/session'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class LikesFeedAPI implements FeedAPI {
  agent: SessionAgent
  params: GetActorLikes.QueryParams

  constructor({
    agent,
    feedParams,
  }: {
    agent: SessionAgent
    feedParams: GetActorLikes.QueryParams
  }) {
    this.agent = agent
    this.params = feedParams
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.getActorLikes({
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
    const res = await this.agent.getActorLikes({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
      // HACKFIX: the API incorrectly returns a cursor when there are no items -sfn
      const isEmptyPage = res.data.feed.length === 0
      return {
        cursor: isEmptyPage ? undefined : res.data.cursor,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}
