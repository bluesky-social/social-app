import {AppBskyFeedDefs} from '@atproto/api'
import {FeedAPI, FeedAPIResponse} from './types'
import {getAgent} from '#/state/session'

export class FollowingFeedAPI implements FeedAPI {
  constructor() {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await getAgent().getTimeline({
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
    const res = await getAgent().getTimeline({
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
