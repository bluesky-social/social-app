import {type Client} from '@atproto/lex'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class FollowingFeedAPI implements FeedAPI {
  client: Client

  constructor({client}: {client: Client}) {
    this.client = client
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const data = await this.client.call(app.bsky.feed.getTimeline, {
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
    const data = await this.client.call(app.bsky.feed.getTimeline, {
      cursor,
      limit,
    })
    return {
      cursor: data.cursor,
      feed: data.feed,
    }
  }
}
