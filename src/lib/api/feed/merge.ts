import {AppBskyFeedDefs, AppBskyFeedGetTimeline} from '@atproto/api'
import shuffle from 'lodash.shuffle'
import {RootStoreModel} from 'state/index'
import {timeout} from 'lib/async/timeout'
import {bundleAsync} from 'lib/async/bundle'
import {feedUriToHref} from 'lib/strings/url-helpers'
import {FeedAPI, FeedAPIResponse, FeedSourceInfo} from './types'

export class MergeFeedAPI implements FeedAPI {
  following: MergeFeedSource_Following
  customFeeds: MergeFeedSource_Custom[] = []
  feedCursor = 0

  constructor(public rootStore: RootStoreModel) {}

  reset() {
    this.following = new MergeFeedSource_Following(this.rootStore)
    this.customFeeds = [] // just empty the array, they will be captured in _fetchNext()
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.rootStore.agent.getTimeline({
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetchNext({limit}: {limit: number}): Promise<FeedAPIResponse> {
    // we capture here to ensure the data has loaded
    this._captureFeedsIfNeeded()

    const promises = []

    // always keep following topped up
    if (this.following.numReady < limit) {
      promises.push(this.following.fetchNext(30))
    }

    // pick the next feeds to sample from
    const feeds = this.customFeeds.slice(this.feedCursor, this.feedCursor + 3)
    this.feedCursor += 3
    if (this.feedCursor > this.customFeeds.length) {
      this.feedCursor = 0
    }
    console.log(
      'sampling',
      feeds.map(f => f.displayName),
    )

    // top up the feeds
    for (const feed of feeds) {
      if (feed.numReady < 5) {
        promises.push(feed.fetchNext(10))
      }
    }

    // give everybody 300ms
    await Promise.all(promises)

    // assemble a response by sampling from feeds with content
    let i = 0
    const candidateFeeds = shuffle([
      this.following,
      ...this.customFeeds.filter(f => f.numReady > 0),
    ])
    console.log(
      'candidates',
      candidateFeeds.map(cf => `${cf.displayName} (${cf.numReady})`),
    )
    const posts: AppBskyFeedDefs.FeedViewPost[] = []
    while (posts.length < limit) {
      let slice = candidateFeeds[i++ % candidateFeeds.length].take(1)
      if (slice[0]) {
        posts.push(slice[0])
      } else {
        if (!candidateFeeds.find(f => f.numReady > 0)) {
          break
        }
      }
    }

    return {
      cursor: posts.length ? 'fake' : undefined,
      feed: posts,
    }
  }

  _captureFeedsIfNeeded() {
    if (this.customFeeds.length === 0) {
      this.customFeeds = shuffle(
        this.rootStore.me.savedFeeds.all.map(
          feed =>
            new MergeFeedSource_Custom(
              this.rootStore,
              feed.uri,
              feed.displayName,
            ),
        ),
      )
    }
  }
}

class MergeFeedSource {
  sourceInfo: FeedSourceInfo | undefined
  cursor: string | undefined = undefined
  queue: AppBskyFeedDefs.FeedViewPost[] = []
  hasMore = true

  constructor(public rootStore: RootStoreModel) {}

  get displayName() {
    return ''
  }

  get numReady() {
    return this.queue.length
  }

  get needsFetch() {
    return this.hasMore && this.queue.length === 0
  }

  reset() {
    this.cursor = undefined
    this.queue = []
    this.hasMore = true
  }

  take(n: number): AppBskyFeedDefs.FeedViewPost[] {
    return this.queue.splice(0, n)
  }

  async fetchNext(n: number) {
    await Promise.race([this._fetchNextInner(n), timeout(500)])
  }

  _fetchNextInner = bundleAsync(async (n: number) => {
    console.log('fetching', this.displayName)
    try {
      const res = await this._getFeed(this.cursor, n)
      if (res.success) {
        this.cursor = res.data.cursor
        if (res.data.feed.length) {
          this.queue = this.queue.concat(res.data.feed)
        } else {
          this.hasMore = false
        }
      } else {
        this.hasMore = false
      }
    } catch (e) {
      console.error(e)
    }
  })

  protected _getFeed(
    _cursor: string | undefined,
    _limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    throw new Error('Must be overridden')
  }
}

class MergeFeedSource_Following extends MergeFeedSource {
  get displayName() {
    return 'Following'
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    return this.rootStore.agent.getTimeline({cursor, limit})
  }
}

class MergeFeedSource_Custom extends MergeFeedSource {
  constructor(
    public rootStore: RootStoreModel,
    public feedUri: string,
    public feedDisplayName: string,
  ) {
    super(rootStore)
    this.sourceInfo = {
      displayName: feedDisplayName,
      uri: feedUriToHref(feedUri),
    }
  }

  get displayName() {
    return this.feedDisplayName
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    const res = await this.rootStore.agent.app.bsky.feed.getFeed({
      cursor,
      limit,
      feed: this.feedUri,
    })
    // NOTE
    // some custom feeds fail to enforce the pagination limit
    // so we manually truncate here
    // -prf
    if (limit && res.data.feed.length > limit) {
      res.data.feed = res.data.feed.slice(0, limit)
    }
    // attach source info
    for (const post of res.data.feed) {
      post.__source = this.sourceInfo
    }
    return res
  }
}
