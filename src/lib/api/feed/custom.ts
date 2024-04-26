import {
  AppBskyFeedDefs,
  AppBskyFeedGetFeed as GetCustomFeed,
  AtpAgent,
  BskyAgent,
} from '@atproto/api'

import {getContentLanguages} from '#/state/preferences/languages'
import {FeedAPI, FeedAPIResponse} from './types'

export class CustomFeedAPI implements FeedAPI {
  getAgent: () => BskyAgent
  params: GetCustomFeed.QueryParams

  constructor({
    getAgent,
    feedParams,
  }: {
    getAgent: () => BskyAgent
    feedParams: GetCustomFeed.QueryParams
  }) {
    this.getAgent = getAgent
    this.params = feedParams
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const contentLangs = getContentLanguages().join(',')
    const res = await this.getAgent().app.bsky.feed.getFeed(
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
    const agent = this.getAgent()
    const res = agent.session
      ? await this.getAgent().app.bsky.feed.getFeed(
          {
            ...this.params,
            cursor,
            limit,
          },
          {
            headers: {
              'Accept-Language': contentLangs,
            },
          },
        )
      : await loggedOutFetch({...this.params, cursor, limit})
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

// HACK
// we want feeds to give language-specific results immediately when a
// logged-out user changes their language. this comes with two problems:
// 1. not all languages have content, and
// 2. our public caching layer isnt correctly busting against the accept-language header
// for now we handle both of these with a manual workaround
// -prf
async function loggedOutFetch({
  feed,
  limit,
  cursor,
}: {
  feed: string
  limit: number
  cursor?: string
}) {
  let contentLangs = getContentLanguages().join(',')

  // manually construct fetch call so we can add the `lang` cache-busting param
  let res = await AtpAgent.fetch!(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}&lang=${contentLangs}`,
    'GET',
    {'Accept-Language': contentLangs},
    undefined,
  )
  if (res.body?.feed?.length) {
    return {
      success: true,
      data: res.body,
    }
  }

  // no data, try again with language headers removed
  res = await AtpAgent.fetch!(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}`,
    'GET',
    {'Accept-Language': ''},
    undefined,
  )
  if (res.body?.feed?.length) {
    return {
      success: true,
      data: res.body,
    }
  }

  return {
    success: false,
    data: {feed: []},
  }
}
