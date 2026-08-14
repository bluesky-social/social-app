import {
  type Client,
  type XrpcRequestParams,
  XrpcResponseError,
} from '@atproto/lex'

import {PUBLIC_APPVIEW} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
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

let loggedOutAppviewClient: Client | undefined

/**
 * The unauthenticated {@link Client} for logged-out feed reads, pointed at the
 * direct appview ({@link PUBLIC_APPVIEW}, `api.bsky.app`).
 *
 * Deliberately NOT the public appview client (`public.api.bsky.app`): that host
 * fronts a cache which does not vary on `Accept-Language`, so it would answer a
 * language-filtered read from another language's cached body. The direct
 * appview respects the header (verified 2026-08-04), at the cost of not being
 * cached. See {@link loggedOutFetch}.
 *
 * A single module-level instance, because there is no session to scope it to.
 * Like the public chat client, it uses plain `fetch` rather than
 * `networkAwareFetch`, matching the ad-hoc fetch it replaces: this read has its
 * own failure handling and should not move the app-wide network signal.
 */
function getLoggedOutAppviewClient(): Client {
  return (loggedOutAppviewClient ??= createLexClient({
    service: PUBLIC_APPVIEW,
  }))
}

/*
 * HACK
 * We want feeds to give language-specific results immediately when a logged-out
 * user changes their language. That comes with two problems:
 * 1. not all languages have content, and
 * 2. our public caching layer does not bust against the `Accept-Language`
 *    header.
 * -prf
 *
 * Problem 2 is why this uses its own client rather than the app's public
 * appview one: it talks to the direct appview, which honors the header, instead
 * of the cached `public.api.bsky.app`, which does not vary on it. That trades
 * CDN caching for language correctness on logged-out feed traffic.
 *
 * Problem 1 is host-independent, so it is still handled here: an empty
 * language-filtered feed is retried once with the language constraint removed.
 */
async function loggedOutFetch(
  params: GetCustomFeedParams,
): Promise<app.bsky.feed.getFeed.$OutputBody | null> {
  const contentLangs = getAppLanguageAsContentLanguage()

  let data = await getFeedOrNull(params, contentLangs)
  if (data?.feed?.length) {
    return data
  }

  // no data, try again with language headers removed
  data = await getFeedOrNull(params, '')
  if (data?.feed?.length) {
    return data
  }

  return null
}

/**
 * A logged-out `getFeed` read that resolves to null on a response error.
 *
 * The pre-client code only guarded `res.ok`, so a failed RESPONSE fell through
 * to the next attempt while a failed REQUEST rejected. Catching
 * `XrpcResponseError` preserves that split: every other lex error - the fetch
 * and validation ones - still propagates.
 */
async function getFeedOrNull(
  params: GetCustomFeedParams,
  contentLangs: string,
): Promise<app.bsky.feed.getFeed.$OutputBody | null> {
  try {
    return await getLoggedOutAppviewClient().call(
      app.bsky.feed.getFeed,
      params,
      {headers: {'Accept-Language': contentLangs}},
    )
  } catch (e) {
    if (e instanceof XrpcResponseError) {
      return null
    }
    throw e
  }
}
