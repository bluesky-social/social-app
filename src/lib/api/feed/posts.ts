import {type Client, type XrpcRequestParams} from '@atproto/lex'

import {logger} from '#/logger'
import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

type GetPostsParams = XrpcRequestParams<typeof app.bsky.feed.getPosts.main>

export class PostListFeedAPI implements FeedAPI {
  client: Client
  params: GetPostsParams
  peek: app.bsky.feed.defs.FeedViewPost | null = null

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: GetPostsParams
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

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  async fetch({}: {}): Promise<FeedAPIResponse> {
    /*
     * A failed request rejects rather than resolving, so the error propagates
     * to the query and drives the feed error UI. The agent behaved the same
     * way - its `success` flag was only ever true - so the empty-page branch
     * this replaces was unreachable.
     */
    const data = await this.client.call(app.bsky.feed.getPosts, {
      ...this.params,
    })
    this.peek = {post: data.posts[0]}
    return {
      feed: data.posts.map(post => ({post})),
    }
  }
}
