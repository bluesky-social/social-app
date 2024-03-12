import {
  AppBskyFeedDefs,
  AppBskyFeedGetListFeed as GetListFeed,
} from '@atproto/api'

import {getAgent} from '#/state/session'

import {FeedAPI, FeedAPIResponse} from './types'

export class ListFeedAPI implements FeedAPI {
  constructor(public params: GetListFeed.QueryParams) {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await getAgent().app.bsky.feed.getListFeed({
      ...this.params,
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await getAgent().app.bsky.feed.getListFeed({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
      return {
        cursor: res.data.cursor,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}
