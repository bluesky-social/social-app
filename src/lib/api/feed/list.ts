import {type Client} from '@atproto/lex-client'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class ListFeedAPI implements FeedAPI {
  client: Client
  params: app.bsky.feed.getListFeed.$Params

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: app.bsky.feed.getListFeed.$Params
  }) {
    this.client = client
    this.params = feedParams
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const res = await this.client.call(app.bsky.feed.getListFeed, {
      ...this.params,
      limit: 1,
    })
    return res.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await this.client.call(app.bsky.feed.getListFeed, {
      ...this.params,
      cursor,
      limit,
    })
    return {
      cursor: res.cursor,
      feed: res.feed,
    }
  }
}
