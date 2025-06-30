import {
  type Agent,
  type AppBskyFeedDefs,
  type AppBskyFeedGetPosts,
} from '@atproto/api'

import {type FeedAPI, type FeedAPIResponse} from './types'

export class PostListFeedAPI implements FeedAPI {
  agent: Agent
  params: AppBskyFeedGetPosts.QueryParams
  peek: AppBskyFeedDefs.FeedViewPost | null = null

  constructor({
    agent,
    feedParams,
  }: {
    agent: Agent
    feedParams: AppBskyFeedGetPosts.QueryParams
  }) {
    this.agent = agent
    this.params = feedParams
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  async fetch({}: {}): Promise<FeedAPIResponse> {
    const res = await this.agent.app.bsky.feed.getPosts({
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
