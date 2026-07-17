import {type Client} from '@atproto/lex-client'

import {logger} from '#/logger'
import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class PostListFeedAPI implements FeedAPI {
  client: Client
  params: app.bsky.feed.getPosts.$Params
  peek: app.bsky.feed.defs.FeedViewPost | null = null

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: app.bsky.feed.getPosts.$Params
  }) {
    this.client = client
    if (feedParams.uris.length > 25) {
      logger.warn(
        `Too many URIs provided - expected 25, got ${feedParams.uris.length}`,
      )
    }
    this.params = {
      uris: feedParams.uris.slice(0, 25),
    }
  }

  setClient(client: Client) {
    this.client = client
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  async fetch({}: {}): Promise<FeedAPIResponse> {
    const res = await this.client.call(app.bsky.feed.getPosts, {
      ...this.params,
    })
    this.peek = {post: res.posts[0]}
    return {
      feed: res.posts.map(post => ({post})),
    }
  }
}
