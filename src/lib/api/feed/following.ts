import {type Client} from '@atproto/lex'

import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedGetTimeline from '#/lexicons/app/bsky/feed/getTimeline'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class FollowingFeedAPI implements FeedAPI {
  client: Client

  constructor({client}: {client: Client}) {
    this.client = client
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const data = await this.client.call(AppBskyFeedGetTimeline, {
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
    const data = await this.client.call(AppBskyFeedGetTimeline, {
      cursor,
      limit,
    })
    return {
      cursor: data.cursor,
      feed: data.feed,
    }
  }
}
