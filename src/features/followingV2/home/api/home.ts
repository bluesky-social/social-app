import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {type app} from '#/lexicons'
import {CustomFeedAPI} from './custom'
import {FollowingFeedAPI} from './following'
import {type FeedAPI, type FeedAPIResponse, type FeedSource} from './types'

// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
/*
 * A synthetic marker, not a real view: its `uri`/`did`/`indexedAt` are
 * deliberately not well-formed, so the literal is asserted rather than branded.
 * Only `post.uri` is ever read (see Feed.tsx).
 */
export const FALLBACK_MARKER_POST = {
  post: {
    uri: 'fallback-marker-post',
    cid: 'fake',
    record: {},
    author: {
      did: 'did:fake',
      handle: 'fake.com',
    },
    indexedAt: new Date().toISOString(),
  },
} as unknown as app.bsky.feed.defs.FeedViewPost

/**
 * Following, falling back to Discover once Following runs out. Which of the two
 * a page continues from is its `source`, so the fallback lives in the pages
 * rather than in this instance.
 */
export class HomeFeedAPI implements FeedAPI {
  following: FollowingFeedAPI
  discover: CustomFeedAPI

  constructor({
    userInterests,
    client,
  }: {
    userInterests?: string
    client: Client
  }) {
    this.following = new FollowingFeedAPI({client})
    this.discover = new CustomFeedAPI({
      client,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot') as AtUriString},
      userInterests,
    })
  }

  async peekLatest({
    source,
  }: {source?: FeedSource} = {}): Promise<app.bsky.feed.defs.FeedViewPost> {
    if (source === 'discover') {
      return this.discover.peekLatest()
    }
    return this.following.peekLatest()
  }

  async fetch({
    cursor,
    since,
    source,
    limit,
  }: {
    cursor: string | undefined
    since?: string
    source?: FeedSource
    limit: number
  }): Promise<FeedAPIResponse> {
    if (source === 'discover') {
      const res = await this.discover.fetch({cursor, limit})
      return {...res, source: 'discover'}
    }

    const res = await this.following.fetch({cursor, since, limit})
    /*
     * A range bounded by `since` sits above posts already loaded, so it never
     * runs out into Discover.
     */
    if (res.cursor || since !== undefined) {
      return res
    }

    /*
     * Following has run out, so this page carries on into Discover. It still
     * starts with Following's posts, so it starts where they do.
     */
    const feed = [...res.feed, FALLBACK_MARKER_POST]
    if (__DEV__) {
      return {startCursor: res.startCursor, feed, source: 'discover'}
    }
    const discover = await this.discover.fetch({cursor: '', limit})
    return {
      cursor: discover.cursor,
      startCursor: res.startCursor,
      source: 'discover',
      feed: feed.concat(discover.feed),
    }
  }
}
