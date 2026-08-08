import {Client, lexParse, type XrpcRequestParams} from '@atproto/lex'

import {
  getAppLanguageAsContentLanguage,
  getContentLanguages,
} from '#/state/preferences/languages'
import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'
import {createBskyTopicsHeader, isBlueskyOwnedFeed} from './utils'

type GetCustomFeedParams = XrpcRequestParams<typeof app.bsky.feed.getFeed.main>

export class CustomFeedAPI implements FeedAPI {
  client: Client
  params: GetCustomFeedParams
  userInterests?: string

  constructor({
    client,
    feedParams,
    userInterests,
  }: {
    client: Client
    feedParams: GetCustomFeedParams
    userInterests?: string
  }) {
    this.client = client
    this.params = feedParams
    this.userInterests = userInterests
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const contentLangs = getContentLanguages().join(',')
    const data = await this.client.call(
      app.bsky.feed.getFeed,
      {
        ...this.params,
        limit: 1,
      },
      {headers: {'Accept-Language': contentLangs}},
    )
    return data.feed[0]
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

    /*
     * The authed branch rejects on failure, so the error propagates to the
     * query and drives the feed error UI (feedgen offline, misconfigured, rate
     * limited). Only the logged-out branch can resolve without data, and it
     * signals that with a null body.
     */
    const data = this.client.did
      ? await this.client.call(
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
      : await loggedOutFetch({...this.params, cursor, limit})

    if (!data) {
      return {
        feed: [],
      }
    }

    // NOTE
    // some custom feeds fail to enforce the pagination limit
    // so we manually truncate here
    // -prf
    const feed =
      data.feed.length > limit ? data.feed.slice(0, limit) : data.feed
    return {
      cursor: feed.length ? data.cursor : undefined,
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
}): Promise<app.bsky.feed.getFeed.$OutputBody | null> {
  let contentLangs = getAppLanguageAsContentLanguage()

  /*
   * This request is hand-rolled rather than issued through a client, so it has
   * to reproduce the header lex would have emitted from the global static.
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
  /*
   * The response is hand-decoded rather than validated, so the lex output shape
   * is asserted here just as the old-world one was.
   */
  let data = res.ok
    ? (lexParse(await res.text()) as app.bsky.feed.getFeed.$OutputBody)
    : null
  if (data?.feed?.length) {
    return data
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
    return data
  }

  return null
}
