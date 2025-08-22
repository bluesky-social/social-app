import { type Agent, type AppGndrFeedDefs, type AppGndrFeedGetPosts,  } from '@gander-social-atproto/api'

import { logger } from '#/logger'
import { type FeedAPI, type FeedAPIResponse } from './types'

export class PostListFeedAPI implements FeedAPI {
  agent: Agent
  params: AppGndrFeedGetPosts.QueryParams
  peek: AppGndrFeedDefs.FeedViewPost | null = null

  constructor({
    agent,
    feedParams,
  }: {
    agent: Agent
    feedParams: AppGndrFeedGetPosts.QueryParams
  }) {
    this.agent = agent
    if (feedParams.uris.length > 25) {
      logger.warn(
        `Too many URIs provided - expected 25, got ${feedParams.uris.length}`,
      )
    }
    this.params = {
      uris: feedParams.uris.slice(0, 25),
    }
  }

  async peekLatest(): Promise<AppGndrFeedDefs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  async fetch({}: {}): Promise<FeedAPIResponse> {
    const res = await this.agent.app.gndr.feed.getPosts({
      ...this.params,
    })
    if (res.success) {
      this.peek = {post: res.data.posts[0]}
      return {
        feed: res.data.posts.map(post => ({post})),
      }
    }
    return {
      feed: [],
    }
  }
}
