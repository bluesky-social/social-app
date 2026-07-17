import {lexParse} from '@atproto/lex'
import {Client} from '@atproto/lex'

import {
  getAppLanguageAsContentLanguage,
  getContentLanguages,
} from '#/state/preferences/languages'
import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'
import {createBskyTopicsHeader, isBlueskyOwnedFeed} from './utils'

/**
 * Input params for {@link CustomFeedAPI}. The generated `$Params` type reflects
 * post-parse output, where `limit` (which has a lexicon default) is required;
 * callers supply only `feed` and let `limit`/`cursor` come from `fetch`.
 */
type CustomFeedParams = {feed: app.bsky.feed.getFeed.$Params['feed']} & Partial<
  Omit<app.bsky.feed.getFeed.$Params, 'feed'>
>

export class CustomFeedAPI implements FeedAPI {
  client: Client
  params: CustomFeedParams
  userInterests?: string

  constructor({
    client,
    feedParams,
    userInterests,
  }: {
    client: Client
    feedParams: CustomFeedParams
    userInterests?: string
  }) {
    this.client = client
    this.params = feedParams
    this.userInterests = userInterests
  }

  setClient(client: Client) {
    this.client = client
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const contentLangs = getContentLanguages().join(',')
    const res = await this.client.call(
      app.bsky.feed.getFeed,
      {
        ...this.params,
        limit: 1,
      },
      {headers: {'Accept-Language': contentLangs}},
    )
    return res.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const contentLangs = getContentLanguages().join(',')
    const isBlueskyOwned = isBlueskyOwnedFeed(this.params.feed)

    let feed: app.bsky.feed.defs.FeedViewPost[]
    let resCursor: string | undefined

    if (this.client.did) {
      const res = await this.client.call(
        app.bsky.feed.getFeed,
        {
          ...this.params,
          cursor,
          limit,
        },
        {
          headers: {
            ...(isBlueskyOwned
              ? createBskyTopicsHeader(this.userInterests)
              : {}),
            'Accept-Language': contentLangs,
          },
        },
      )
      feed = res.feed
      resCursor = res.cursor
    } else {
      const res = await loggedOutFetch({...this.params, cursor, limit})
      if (!res.success) {
        return {feed: []}
      }
      feed = res.data.feed
      resCursor = res.data.cursor
    }

    // NOTE
    // some custom feeds fail to enforce the pagination limit
    // so we manually truncate here
    // -prf
    if (feed.length > limit) {
      feed = feed.slice(0, limit)
    }
    return {
      cursor: feed.length ? resCursor : undefined,
      feed,
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
}): Promise<{success: boolean; data: app.bsky.feed.getFeed.$OutputBody}> {
  let contentLangs = getAppLanguageAsContentLanguage()

  /*
   * Copied from our root `Agent` class. The global (`;redact`-suffixed) app
   * labelers are kept on the lex `Client` static (synced in
   * `#/state/session/moderation`), replacing the old `AtpAgent.appLabelers`.
   */
  const labelersHeader = {
    'atproto-accept-labelers': Client.appLabelers
      .map(l => `${l};redact`)
      .join(', '),
  }

  // manually construct fetch call so we can add the `lang` cache-busting param
  let res = await fetch(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}&lang=${contentLangs}`,
    {
      method: 'GET',
      headers: {'Accept-Language': contentLangs, ...labelersHeader},
    },
  )
  let data = res.ok
    ? (lexParse(await res.text()) as app.bsky.feed.getFeed.$OutputBody)
    : null
  if (data?.feed?.length) {
    return {
      success: true,
      data,
    }
  }

  // no data, try again with language headers removed
  res = await fetch(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}`,
    {method: 'GET', headers: {'Accept-Language': '', ...labelersHeader}},
  )
  data = res.ok
    ? (lexParse(await res.text()) as app.bsky.feed.getFeed.$OutputBody)
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
