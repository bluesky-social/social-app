import {type Client} from '@atproto/lex-client'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class FollowingFeedAPI implements FeedAPI {
  client: Client

  constructor({client}: {client: Client}) {
    this.client = client
  }

  setClient(client: Client) {
    this.client = client
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const res = await this.client.call(app.bsky.feed.getTimeline, {
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
    const res = await this.client.call(app.bsky.feed.getTimeline, {
      cursor,
      limit,
    })
    return {
      cursor: res.cursor,
      feed: res.feed,
    }
  }
}
