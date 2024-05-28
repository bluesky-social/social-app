import {AppBskyFeedDefs, BskyAgent} from '@atproto/api'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {CustomFeedAPI} from './custom'
import {FollowingFeedAPI} from './following'
import {FeedAPI, FeedAPIResponse} from './types'

// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
export const FALLBACK_MARKER_POST: AppBskyFeedDefs.FeedViewPost = {
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
}

export class HomeFeedAPI implements FeedAPI {
  agent: BskyAgent
  following: FollowingFeedAPI
  discover: CustomFeedAPI
  usingDiscover = false
  itemCursor = 0
  userInterests?: string

  constructor({
    userInterests,
    agent,
  }: {
    userInterests?: string
    agent: BskyAgent
  }) {
    this.agent = agent
    this.following = new FollowingFeedAPI({agent})
    this.discover = new CustomFeedAPI({
      agent,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot')},
    })
    this.userInterests = userInterests
  }

  reset() {
    this.following = new FollowingFeedAPI({agent: this.agent})
    this.discover = new CustomFeedAPI({
      agent: this.agent,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot')},
      userInterests: this.userInterests,
    })
    this.usingDiscover = false
    this.itemCursor = 0
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
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
    let posts: AppBskyFeedDefs.FeedViewPost[] = []

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

    if (this.usingDiscover) {
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
