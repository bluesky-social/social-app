import {type Client, type XrpcRequestParams} from '@atproto/lex'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

type GetActorLikesParams = XrpcRequestParams<
  typeof app.bsky.feed.getActorLikes.main
>

export class LikesFeedAPI implements FeedAPI {
  client: Client
  params: GetActorLikesParams

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: GetActorLikesParams
  }) {
    this.client = client
    this.params = feedParams
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const data = await this.client.call(app.bsky.feed.getActorLikes, {
      ...this.params,
      limit: 1,
    })
    return data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    /*
     * A failed request rejects rather than resolving, so the error propagates
     * to the query and drives the feed error UI. The agent behaved the same
     * way - its `success` flag was only ever true - so the empty-page branch
     * this replaces was unreachable.
     */
    const data = await this.client.call(app.bsky.feed.getActorLikes, {
      ...this.params,
      cursor,
      limit,
    })
    return {
      cursor: data.cursor,
      feed: data.feed,
    }
  }
}
