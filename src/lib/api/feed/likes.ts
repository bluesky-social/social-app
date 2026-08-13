import {
  type AppBskyFeedDefs,
  type AppBskyFeedGetActorLikes as GetActorLikes,
  type AtpAgent,
} from '@atproto/api'

import {type FeedAPI, type FeedAPIResponse} from './types'

const MAX_CONSECUTIVE_EMPTY_PAGES = 5

export class LikesFeedAPI implements FeedAPI {
  agent: AtpAgent
  params: GetActorLikes.QueryParams
  consecutiveEmptyPages = 0

  constructor({
    agent,
    feedParams,
  }: {
    agent: AtpAgent
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

    if (!res.success) {
      return {
        feed: [],
      }
    }

    /*
     * getActorLikes may return empty pages with cursors for no-like gaps. Keep
     * following them to reach older likes, but stop after 5 consecutive empty
     * pages; that covers roughly a one-year gap and avoids infinite pagination
     * past the oldest like (atproto issue #3087).
     */
    if (res.data.feed.length === 0) {
      this.consecutiveEmptyPages++
    } else {
      this.consecutiveEmptyPages = 0
    }

    return {
      cursor:
        this.consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY_PAGES
          ? undefined
          : res.data.cursor,
      feed: res.data.feed,
    }
  }
}
