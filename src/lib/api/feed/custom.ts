import {
  AppBskyFeedDefs,
  AppBskyFeedGetFeed as GetCustomFeed,
} from '@atproto/api'
import {FeedAPI, FeedAPIResponse} from './types'
import {getAgent} from '#/state/session'
import {getContentLanguages} from '#/state/preferences/languages'

export class CustomFeedAPI implements FeedAPI {
  constructor(public params: GetCustomFeed.QueryParams) {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const contentLangs = getContentLanguages().join(',')
    const res = await getAgent().app.bsky.feed.getFeed(
      {
        ...this.params,
        limit: 1,
      },
      {headers: {'Accept-Language': contentLangs}},
    )
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const contentLangs = getContentLanguages().join(',')
    const res = await getAgent().app.bsky.feed.getFeed(
      {
        ...this.params,
        cursor,
        limit,
      },
      {headers: {'Accept-Language': contentLangs}},
    )
    if (res.success) {
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      return {
        cursor: res.data.feed.length ? res.data.cursor : undefined,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}
