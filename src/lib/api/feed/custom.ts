import {
  AppGndrFeedDefs,
  AppGndrFeedGetFeed as GetCustomFeed,
  GndrAgent,
  jsonStringToLex,
} from '@atproto/api'

import {
  getAppLanguageAsContentLanguage,
  getContentLanguages,
} from '#/state/preferences/languages'
import {FeedAPI, FeedAPIResponse} from './types'
import {createGndrTopicsHeader, isGanderOwnedFeed} from './utils'

export class CustomFeedAPI implements FeedAPI {
  agent: GndrAgent
  params: GetCustomFeed.QueryParams
  userInterests?: string

  constructor({
    agent,
    feedParams,
    userInterests,
  }: {
    agent: GndrAgent
    feedParams: GetCustomFeed.QueryParams
    userInterests?: string
  }) {
    this.agent = agent
    this.params = feedParams
    this.userInterests = userInterests
  }

  async peekLatest(): Promise<AppGndrFeedDefs.FeedViewPost> {
    const contentLangs = getContentLanguages().join(',')
    const res = await this.agent.app.gndr.feed.getFeed(
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
    const agent = this.agent
    const isGanderOwned = isGanderOwnedFeed(this.params.feed)

    const res = agent.did
      ? await this.agent.app.gndr.feed.getFeed(
          {
            ...this.params,
            cursor,
            limit,
          },
          {
            headers: {
              ...(isGanderOwned
                ? createGndrTopicsHeader(this.userInterests)
                : {}),
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
  let contentLangs = getAppLanguageAsContentLanguage()

  /**
   * Copied from our root `Agent` class
   * @see https://github.com/gander-social/atproto/blob/60df3fc652b00cdff71dd9235d98a7a4bb828f05/packages/api/src/agent.ts#L120
   */
  const labelersHeader = {
    'atproto-accept-labelers': GndrAgent.appLabelers
      .map(l => `${l};redact`)
      .join(', '),
  }

  // manually construct fetch call so we can add the `lang` cache-busting param
  let res = await fetch(
    `https://api.gndr.app/xrpc/app.gndr.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}&lang=${contentLangs}`,
    {
      method: 'GET',
      headers: {'Accept-Language': contentLangs, ...labelersHeader},
    },
  )
  let data = res.ok
    ? (jsonStringToLex(await res.text()) as GetCustomFeed.OutputSchema)
    : null
  if (data?.feed?.length) {
    return {
      success: true,
      data,
    }
  }

  // no data, try again with language headers removed
  res = await fetch(
    `https://api.gndr.app/xrpc/app.gndr.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}`,
    {method: 'GET', headers: {'Accept-Language': '', ...labelersHeader}},
  )
  data = res.ok
    ? (jsonStringToLex(await res.text()) as GetCustomFeed.OutputSchema)
    : null
  if (data?.feed?.length) {
    return {
      success: true,
      data,
    }
  }

  return {
    success: false,
    data: {feed: []},
  }
}
