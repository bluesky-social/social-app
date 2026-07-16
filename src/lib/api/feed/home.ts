import {type Client} from '@atproto/lex-client'
import {type AtUriString} from '@atproto/syntax'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {type app} from '#/lexicons'
import {CustomFeedAPI} from './custom'
import {FollowingFeedAPI} from './following'
import {type FeedAPI, type FeedAPIResponse} from './types'

// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
/*
 * A sentinel post whose fields intentionally violate the branded lexicon
 * formats (`uri`, `did`, `indexedAt`), so it is asserted into the view type.
 */
export const FALLBACK_MARKER_POST: app.bsky.feed.defs.FeedViewPost = {
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

export class HomeFeedAPI implements FeedAPI {
  client: Client
  following: FollowingFeedAPI
  discover: CustomFeedAPI
  usingDiscover = false
  itemCursor = 0
  userInterests?: string

  constructor({
    userInterests,
    client,
  }: {
    userInterests?: string
    client: Client
  }) {
    this.client = client
    this.following = new FollowingFeedAPI({client})
    this.discover = new CustomFeedAPI({
      client,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot') as AtUriString},
    })
    this.userInterests = userInterests
  }

  reset() {
    this.following = new FollowingFeedAPI({client: this.client})
    this.discover = new CustomFeedAPI({
      client: this.client,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot') as AtUriString},
      userInterests: this.userInterests,
    })
    this.usingDiscover = false
    this.itemCursor = 0
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    if (this.usingDiscover) {
      return this.discover.peekLatest()
    }
    return this.following.peekLatest()
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    if (!cursor) {
      this.reset()
    }

    let returnCursor
    let posts: app.bsky.feed.defs.FeedViewPost[] = []

    if (!this.usingDiscover) {
      const res = await this.following.fetch({cursor, limit})
      returnCursor = res.cursor
      posts = posts.concat(res.feed)
      if (!returnCursor) {
        cursor = ''
        posts.push(FALLBACK_MARKER_POST)
        this.usingDiscover = true
      }
    }

    if (this.usingDiscover && !__DEV__) {
      const res = await this.discover.fetch({cursor, limit})
      returnCursor = res.cursor
      posts = posts.concat(res.feed)
    }

    return {
      cursor: returnCursor,
      feed: posts,
    }
  }
}
