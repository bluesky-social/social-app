import {type Client, type XrpcRequestParams} from '@atproto/lex'

import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedGetActorLikes from '#/lexicons/app/bsky/feed/getActorLikes'
import {type FeedAPI, type FeedAPIResponse} from './types'

type GetActorLikesParams = XrpcRequestParams<
  typeof AppBskyFeedGetActorLikes.main
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

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const data = await this.client.call(AppBskyFeedGetActorLikes, {
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
    const data = await this.client.call(AppBskyFeedGetActorLikes, {
      ...this.params,
      cursor,
      limit,
    })
    // HACKFIX: the API incorrectly returns a cursor when there are no items -sfn
    const isEmptyPage = data.feed.length === 0
    return {
      cursor: isEmptyPage ? undefined : data.cursor,
      feed: data.feed,
    }
  }
}
