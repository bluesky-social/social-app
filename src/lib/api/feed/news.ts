import {type AppBskyFeedDefs, type AtpAgent} from '@atproto/api'
import chunk from 'lodash.chunk'

import {type FeedAPI, type FeedAPIResponse} from './types'

// News should be fresh: stop paginating a source once it goes past this age.
const POST_AGE_CUTOFF_MS = 7 * 24 * 60 * 60 * 1000
// Author feeds are fetched in parallel; bound how many run at once so a large
// source set does not fire dozens of requests simultaneously.
const FETCH_CONCURRENCY = 8

type SourceState = {
  did: string
  cursor: string | undefined
  queue: AppBskyFeedDefs.FeedViewPost[]
  hasMore: boolean
}

/**
 * Merges the latest posts from several source accounts into one feed. The
 * appview has no multi-author endpoint, so we fetch each author feed separately
 * and round-robin across them, giving every source equal weight rather than
 * letting a high-frequency one dominate. Per-source cursors live on the
 * instance and are threaded across pages by `usePostFeedQuery`; a fetch with no
 * cursor (a fresh load) resets them.
 */
export class NewsFeedAPI implements FeedAPI {
  agent: AtpAgent
  dids: string[]
  sources: SourceState[] = []
  seen = new Set<string>()
  itemCursor = 0

  constructor({agent, dids}: {agent: AtpAgent; dids: string[]}) {
    this.agent = agent
    this.dids = dids.filter(Boolean)
  }

  reset() {
    this.sources = this.dids.map(did => ({
      did,
      cursor: undefined,
      queue: [],
      hasMore: true,
    }))
    this.seen = new Set()
    this.itemCursor = 0
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.getAuthorFeed({
      actor: this.dids[0],
      filter: 'posts_no_replies',
      limit: 1,
    })
    return res.data.feed[0]
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

    const minDate = Date.now() - POST_AGE_CUTOFF_MS

    // Refill any source whose queue is running low and still has more to give.
    const stale = this.sources.filter(
      source => source.hasMore && source.queue.length < limit,
    )
    for (const batch of chunk(stale, FETCH_CONCURRENCY)) {
      await Promise.all(batch.map(source => this._topUp(source, minDate)))
    }

    const posts = this._takeRoundRobin(limit)

    const exhausted = this.sources.every(
      source => !source.hasMore && source.queue.length === 0,
    )
    return {
      feed: posts,
      cursor:
        posts.length > 0 && !exhausted ? String(++this.itemCursor) : undefined,
    }
  }

  async _topUp(source: SourceState, minDate: number) {
    try {
      const res = await this.agent.getAuthorFeed({
        actor: source.did,
        filter: 'posts_no_replies',
        cursor: source.cursor,
        limit: 30,
      })
      source.cursor = res.data.cursor
      if (!res.data.cursor || res.data.feed.length === 0) {
        source.hasMore = false
      }
      for (const item of res.data.feed) {
        if (new Date(item.post.indexedAt).getTime() < minDate) {
          // Author feeds are newest-first, so once we cross the cutoff the rest
          // of this source's history is older too.
          source.hasMore = false
          break
        }
        if (this.seen.has(item.post.uri)) continue
        this.seen.add(item.post.uri)
        source.queue.push(item)
      }
    } catch {
      // A single failing source should not take down the whole feed.
      source.hasMore = false
    }
  }

  // Take one post from each source per pass for equal representation, visiting
  // sources newest-head first so the page still trends fresh.
  _takeRoundRobin(limit: number): AppBskyFeedDefs.FeedViewPost[] {
    const posts: AppBskyFeedDefs.FeedViewPost[] = []
    while (posts.length < limit) {
      const ready = this.sources.filter(source => source.queue.length > 0)
      if (ready.length === 0) break
      ready.sort(
        (a, b) =>
          new Date(b.queue[0].post.indexedAt).getTime() -
          new Date(a.queue[0].post.indexedAt).getTime(),
      )
      for (const source of ready) {
        if (posts.length >= limit) break
        const next = source.queue.shift()
        if (next) posts.push(next)
      }
    }
    return posts
  }
}
