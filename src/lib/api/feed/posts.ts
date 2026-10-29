import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {app} from '#/lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * The most URIs `getPosts` takes, so longer lists are fetched in pages.
 */
const MAX_URIS_PER_REQUEST = 25

export class PostListFeedAPI implements FeedAPI {
  client: Client
  uris: AtUriString[]
  peek: app.bsky.feed.defs.FeedViewPost | null = null

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: {uris: AtUriString[]}
  }) {
    this.client = client
    this.uris = feedParams.uris
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  async fetch({
    cursor,
  }: {
    cursor: string | undefined
  }): Promise<FeedAPIResponse> {
    // The cursor is the offset into `uris` of the next page
    const start = cursor ? Number(cursor) : 0
    const end = start + MAX_URIS_PER_REQUEST
    const uris = this.uris.slice(start, end)
    // An unreadable link leaves nothing to fetch, which reads as an empty feed
    if (uris.length === 0) {
      return {feed: []}
    }
    /*
     * A failed request rejects rather than resolving, so the error propagates
     * to the query and drives the feed error UI. The agent behaved the same
     * way - its `success` flag was only ever true - so the empty-page branch
     * this replaces was unreachable.
     */
    const data = await this.client.call(app.bsky.feed.getPosts, {uris})
    if (start === 0) {
      this.peek = {post: data.posts[0]}
    }
    return {
      cursor: end < this.uris.length ? String(end) : undefined,
      feed: data.posts.map(post => ({post})),
    }
  }
}
