import {type Client} from '@atproto/lex-client'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class LikesFeedAPI implements FeedAPI {
  client: Client
  params: app.bsky.feed.getActorLikes.$Params

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: app.bsky.feed.getActorLikes.$Params
  }) {
    this.client = client
    this.params = feedParams
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const res = await this.client.call(app.bsky.feed.getActorLikes, {
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
    const res = await this.client.call(app.bsky.feed.getActorLikes, {
      ...this.params,
      cursor,
      limit,
    })
    // HACKFIX: the API incorrectly returns a cursor when there are no items -sfn
    const isEmptyPage = res.feed.length === 0
    return {
      cursor: isEmptyPage ? undefined : res.cursor,
      feed: res.feed,
    }
  }
}
