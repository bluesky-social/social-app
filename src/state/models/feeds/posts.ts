import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedDefs,
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  AppBskyFeedGetFeed as GetCustomFeed,
  AppBskyFeedGetActorLikes as GetActorLikes,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {FeedTuner} from 'lib/api/feed-manip'
import {PostsFeedSliceModel} from './posts-slice'
import {track} from 'lib/analytics/analytics'
import {FeedViewPostsSlice} from 'lib/api/feed-manip'
import {timeout} from 'lib/async/timeout'

const PAGE_SIZE = 30

type Options = {
  /**
   * Formats the feed in a flat array with no threading of replies, just
   * top-level posts.
   */
  isSimpleFeed?: boolean
}

type QueryParams =
  | GetTimeline.QueryParams
  | GetAuthorFeed.QueryParams
  | GetCustomFeed.QueryParams

export class PostsFeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasNewLatest = false
  hasLoaded = false
  isBlocking = false
  isBlockedBy = false
  error = ''
  loadMoreError = ''
  params: QueryParams
  hasMore = true
  loadMoreCursor: string | undefined
  pollCursor: string | undefined
  tuner = new FeedTuner()
  mergeFeed = new MergeFeedManager(this.rootStore)
  pageSize = PAGE_SIZE
  options: Options = {}

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // used to track if a feed is coming up empty
  emptyFetches = 0

  // data
  slices: PostsFeedSliceModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author' | 'custom' | 'likes',
    params: QueryParams,
    options?: Options,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
        loadMoreCursor: false,
      },
      {autoBind: true},
    )
    this.params = params
    this.options = options || {}
  }

  get hasContent() {
    return this.slices.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  setHasNewLatest(v: boolean) {
    this.hasNewLatest = v
  }

  // public api
  // =

  /**
   * Nuke all data
   */
  clear() {
    this.rootStore.log.debug('FeedModel:clear')
    this.isLoading = false
    this.isRefreshing = false
    this.hasNewLatest = false
    this.hasLoaded = false
    this.error = ''
    this.hasMore = true
    this.loadMoreCursor = undefined
    this.pollCursor = undefined
    this.slices = []
    this.tuner.reset()
  }

  get feedTuners() {
    const areRepliesEnabled = this.rootStore.preferences.homeFeedRepliesEnabled
    const repliesThreshold = this.rootStore.preferences.homeFeedRepliesThreshold
    const areRepostsEnabled = this.rootStore.preferences.homeFeedRepostsEnabled
    const areQuotePostsEnabled =
      this.rootStore.preferences.homeFeedQuotePostsEnabled

    if (this.feedType === 'custom') {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.preferredLangOnly(
          this.rootStore.preferences.contentLanguages,
        ),
      ]
    }
    if (this.feedType === 'home') {
      const feedTuners = []

      if (areRepostsEnabled) {
        feedTuners.push(FeedTuner.dedupReposts)
      } else {
        feedTuners.push(FeedTuner.removeReposts)
      }

      if (areRepliesEnabled) {
        feedTuners.push(FeedTuner.likedRepliesOnly({repliesThreshold}))
      } else {
        feedTuners.push(FeedTuner.removeReplies)
      }

      if (!areQuotePostsEnabled) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }

      return feedTuners
    }
    return []
  }

  /**
   * Load for first render
   */
  setup = bundleAsync(async (isRefreshing: boolean = false) => {
    this.rootStore.log.debug('FeedModel:setup', {isRefreshing})
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    await this.lock.acquireAsync()
    try {
      this.setHasNewLatest(false)
      this.mergeFeed.reset()
      this.tuner.reset()
      this._xLoading(isRefreshing)
      try {
        const res = await this._getFeed({limit: this.pageSize})
        await this._replaceAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle(e)
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Register any event listeners. Returns a cleanup function.
   */
  registerListeners() {
    const sub = this.rootStore.onPostDeleted(this.onPostDeleted.bind(this))
    return () => sub.remove()
  }

  /**
   * Reset and load
   */
  async refresh() {
    await this.setup(true)
  }

  /**
   * Load more posts to the end of the feed
   */
  loadMore = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      if (!this.hasMore || this.hasError) {
        return
      }
      this._xLoading()
      try {
        const res = await this._getFeed({
          cursor: this.loadMoreCursor,
          limit: this.pageSize,
        })
        await this._appendAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle(undefined, e)
        runInAction(() => {
          this.hasMore = false
        })
      }
    } finally {
      this.lock.release()
      if (this.feedType === 'custom') {
        track('CustomFeed:LoadMore')
      }
    }
  })

  /**
   * Attempt to load more again after a failure
   */
  async retryLoadMore() {
    this.loadMoreError = ''
    this.hasMore = true
    return this.loadMore()
  }

  /**
   * Update content in-place
   */
  update = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      if (!this.slices.length) {
        return
      }
      this._xLoading()
      let numToFetch = this.slices.length
      let cursor
      try {
        do {
          const res: GetTimeline.Response = await this._getFeed({
            cursor,
            limit: Math.min(numToFetch, 100),
          })
          if (res.data.feed.length === 0) {
            break // sanity check
          }
          this._updateAll(res)
          numToFetch -= res.data.feed.length
          cursor = res.data.cursor
        } while (cursor && numToFetch > 0)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('FeedView: Failed to update', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Check if new posts are available
   */
  async checkForLatest() {
    if (!this.hasLoaded || this.hasNewLatest || this.isLoading) {
      return
    }
    const res = await this._getFeed({limit: 1})
    if (res.data.feed[0]) {
      const slices = this.tuner.tune(res.data.feed, this.feedTuners, {
        dryRun: true,
      })
      if (slices[0]) {
        const sliceModel = new PostsFeedSliceModel(this.rootStore, slices[0])
        if (sliceModel.moderation.content.filter) {
          return
        }
        this.setHasNewLatest(sliceModel.uri !== this.pollCursor)
      }
    }
  }

  /**
   * Updates the UI after the user has created a post
   */
  onPostCreated() {
    if (!this.slices.length) {
      return this.refresh()
    } else {
      this.setHasNewLatest(true)
    }
  }

  /**
   * Removes posts from the feed upon deletion.
   */
  onPostDeleted(uri: string) {
    let i
    do {
      i = this.slices.findIndex(slice => slice.containsUri(uri))
      if (i !== -1) {
        this.slices.splice(i, 1)
      }
    } while (i !== -1)
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(error?: any, loadMoreError?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.isBlocking = error instanceof GetAuthorFeed.BlockedActorError
    this.isBlockedBy = error instanceof GetAuthorFeed.BlockedByActorError
    this.error = cleanError(error)
    this.loadMoreError = cleanError(loadMoreError)
    if (error) {
      this.rootStore.log.error('Posts feed request failed', error)
    }
    if (loadMoreError) {
      this.rootStore.log.error(
        'Posts feed load-more request failed',
        loadMoreError,
      )
    }
  }

  // helper functions
  // =

  async _replaceAll(
    res: GetTimeline.Response | GetAuthorFeed.Response | GetCustomFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.post.uri
    return this._appendAll(res, true)
  }

  async _appendAll(
    res: GetTimeline.Response | GetAuthorFeed.Response | GetCustomFeed.Response,
    replace = false,
  ) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    if (replace) {
      this.emptyFetches = 0
    }

    this.rootStore.me.follows.hydrateProfiles(
      res.data.feed.map(item => item.post.author),
    )
    for (const item of res.data.feed) {
      this.rootStore.posts.fromFeedItem(item)
    }

    const slices = this.options.isSimpleFeed
      ? res.data.feed.map(item => new FeedViewPostsSlice([item]))
      : this.tuner.tune(res.data.feed, this.feedTuners)

    const toAppend: PostsFeedSliceModel[] = []
    for (const slice of slices) {
      const sliceModel = new PostsFeedSliceModel(this.rootStore, slice)
      const dupTest = (item: PostsFeedSliceModel) =>
        item._reactKey === sliceModel._reactKey
      // sanity check
      // if a duplicate _reactKey passes through, the UI breaks hard
      if (!replace) {
        if (this.slices.find(dupTest) || toAppend.find(dupTest)) {
          continue
        }
      }
      toAppend.push(sliceModel)
    }
    runInAction(() => {
      if (replace) {
        this.slices = toAppend
      } else {
        this.slices = this.slices.concat(toAppend)
      }
      if (toAppend.length === 0) {
        this.emptyFetches++
        if (this.emptyFetches >= 10) {
          this.hasMore = false
        }
      }
    })
  }

  _updateAll(
    res: GetTimeline.Response | GetAuthorFeed.Response | GetCustomFeed.Response,
  ) {
    for (const item of res.data.feed) {
      this.rootStore.posts.fromFeedItem(item)
      const existingSlice = this.slices.find(slice =>
        slice.containsUri(item.post.uri),
      )
      if (existingSlice) {
        const existingItem = existingSlice.items.find(
          item2 => item2.post.uri === item.post.uri,
        )
        if (existingItem) {
          existingItem.copyMetrics(item)
        }
      }
    }
  }

  protected async _getFeed(
    params: QueryParams,
  ): Promise<
    GetTimeline.Response | GetAuthorFeed.Response | GetCustomFeed.Response
  > {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'home') {
      return this.mergeFeed.getFeed(params.limit)
      // return this.rootStore.agent.getTimeline(params as GetTimeline.QueryParams)
    } else if (this.feedType === 'custom') {
      const res = await this.rootStore.agent.app.bsky.feed.getFeed(
        params as GetCustomFeed.QueryParams,
      )
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (params.limit && res.data.feed.length > params.limit) {
        res.data.feed = res.data.feed.slice(0, params.limit)
      }
      return res
    } else if (this.feedType === 'author') {
      return this.rootStore.agent.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    } else {
      return this.rootStore.agent.getActorLikes(
        params as GetActorLikes.QueryParams,
      )
    }
  }
}

/*
- anchor more strongly against follows (show first, show more)
- reduce frequency of consecutive samples
- dont start inserting until there are enough
- add UI element
*/

import shuffle from 'lodash.shuffle'

class MergeFeedSource {
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
      const res = await this._getFeed({cursor: this.cursor, limit: n})
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
    _params: QueryParams,
  ): Promise<GetTimeline.Response | GetCustomFeed.Response> {
    throw new Error('Must be overridden')
  }
}

class MergeFeedSource_Following extends MergeFeedSource {
  get displayName() {
    return 'Following'
  }

  protected async _getFeed(params: QueryParams): Promise<GetTimeline.Response> {
    return this.rootStore.agent.getTimeline(params)
  }
}

class MergeFeedSource_Custom extends MergeFeedSource {
  constructor(
    public rootStore: RootStoreModel,
    public feedUri: string,
    public feedDisplayName: string,
  ) {
    super(rootStore)
  }

  get displayName() {
    return this.feedDisplayName
  }

  protected async _getFeed(
    params: QueryParams,
  ): Promise<GetCustomFeed.Response> {
    const res = await this.rootStore.agent.app.bsky.feed.getFeed({
      ...(params as GetCustomFeed.QueryParams),
      feed: this.feedUri,
    })
    // NOTE
    // some custom feeds fail to enforce the pagination limit
    // so we manually truncate here
    // -prf
    if (params.limit && res.data.feed.length > params.limit) {
      res.data.feed = res.data.feed.slice(0, params.limit)
    }
    // DEBUG
    for (const post of res.data.feed) {
      // @ts-ignore debug
      post.post.record.text = `[${
        this.feedDisplayName
      }] ${post.post.record.text.slice(0, 200)}`
    }
    return res
  }
}

class MergeFeedManager {
  following: MergeFeedSource_Following
  customFeeds: MergeFeedSource_Custom[] = []
  feedCursor = 0

  constructor(public rootStore: RootStoreModel) {}

  reset() {
    this.following = new MergeFeedSource_Following(this.rootStore)
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
    // console.log(this.customFeeds)
  }

  async getFeed(limit: number): Promise<GetCustomFeed.Response> {
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
      success: true,
      headers: {},
      data: {
        cursor: 'fake',
        feed: posts,
      },
    }
  }
}
