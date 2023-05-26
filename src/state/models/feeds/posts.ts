import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  AppBskyFeedGetFeed as GetCustomFeed,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import sampleSize from 'lodash.samplesize'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {SUGGESTED_FOLLOWS} from 'lib/constants'
import {
  getCombinedCursors,
  getMultipleAuthorsPosts,
  mergePosts,
} from 'lib/api/build-suggested-posts'
import {FeedTuner, FeedViewPostsSlice} from 'lib/api/feed-manip'
import {PostsFeedSliceModel} from './post'

const PAGE_SIZE = 30
let _idCounter = 0

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
  params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams
  hasMore = true
  loadMoreCursor: string | undefined
  pollCursor: string | undefined
  tuner = new FeedTuner()
  pageSize = PAGE_SIZE

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // used to track if what's hot is coming up empty
  emptyFetches = 0

  // data
  slices: PostsFeedSliceModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author' | 'suggested' | 'custom',
    params:
      | GetTimeline.QueryParams
      | GetAuthorFeed.QueryParams
      | GetCustomFeed.QueryParams,
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

  get nonReplyFeed() {
    if (this.feedType === 'author') {
      return this.slices.filter(slice => {
        const params = this.params as GetAuthorFeed.QueryParams
        const item = slice.rootItem
        const isRepost =
          item?.reasonRepost?.by?.handle === params.actor ||
          item?.reasonRepost?.by?.did === params.actor
        const allow =
          !item.postRecord?.reply || // not a reply
          isRepost // but allow if it's a repost
        return allow
      })
    } else {
      return this.slices
    }
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

  switchFeedType(feedType: 'home' | 'suggested') {
    if (this.feedType === feedType) {
      return
    }
    this.feedType = feedType
    return this.setup()
  }

  get feedTuners() {
    if (this.feedType === 'custom') {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.preferredLangOnly(
          this.rootStore.preferences.contentLanguages,
        ),
      ]
    }
    if (this.feedType === 'home') {
      return [FeedTuner.dedupReposts, FeedTuner.likedRepliesOnly]
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
    if (this.hasNewLatest || this.feedType === 'suggested') {
      return
    }
    const res = await this._getFeed({limit: this.pageSize})
    const tuner = new FeedTuner()
    const slices = tuner.tune(res.data.feed, this.feedTuners)
    this.setHasNewLatest(slices[0]?.uri !== this.slices[0]?.uri)
  }

  /**
   * Fetches the given post and adds it to the top
   * Used by the composer to add their new posts
   */
  async addPostToTop(uri: string) {
    if (!this.slices.length) {
      return this.refresh()
    }
    try {
      const res = await this.rootStore.agent.app.bsky.feed.getPosts({
        uris: [uri],
      })
      const toPrepend = new PostsFeedSliceModel(
        this.rootStore,
        uri,
        new FeedViewPostsSlice(res.data.posts.map(post => ({post}))),
      )
      runInAction(() => {
        this.slices = [toPrepend].concat(this.slices)
      })
    } catch (e) {
      this.rootStore.log.error('Failed to load post to prepend', {e})
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

    const slices = this.tuner.tune(res.data.feed, this.feedTuners)

    const toAppend: PostsFeedSliceModel[] = []
    for (const slice of slices) {
      const sliceModel = new PostsFeedSliceModel(
        this.rootStore,
        `item-${_idCounter++}`,
        slice,
      )
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
    params:
      | GetTimeline.QueryParams
      | GetAuthorFeed.QueryParams
      | GetCustomFeed.QueryParams,
  ): Promise<
    GetTimeline.Response | GetAuthorFeed.Response | GetCustomFeed.Response
  > {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'suggested') {
      const responses = await getMultipleAuthorsPosts(
        this.rootStore,
        sampleSize(SUGGESTED_FOLLOWS(String(this.rootStore.agent.service)), 20),
        params.cursor,
        20,
      )
      const combinedCursor = getCombinedCursors(responses)
      const finalData = mergePosts(responses, {bestOfOnly: true})
      const lastHeaders = responses[responses.length - 1].headers
      return {
        success: true,
        data: {
          feed: finalData,
          cursor: combinedCursor,
        },
        headers: lastHeaders,
      }
    } else if (this.feedType === 'home') {
      return this.rootStore.agent.getTimeline(params as GetTimeline.QueryParams)
    } else if (this.feedType === 'custom') {
      return this.rootStore.agent.app.bsky.feed.getFeed(
        params as GetCustomFeed.QueryParams,
      )
    } else {
      return this.rootStore.agent.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    }
  }
}
