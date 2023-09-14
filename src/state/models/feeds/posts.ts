import {makeAutoObservable, runInAction} from 'mobx'
import {
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

import {FeedAPI, FeedAPIResponse} from 'lib/api/feed/types'
import {FollowingFeedAPI} from 'lib/api/feed/following'
import {AuthorFeedAPI} from 'lib/api/feed/author'
import {LikesFeedAPI} from 'lib/api/feed/likes'
import {CustomFeedAPI} from 'lib/api/feed/custom'
import {MergeFeedAPI} from 'lib/api/feed/merge'

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
  | GetActorLikes.QueryParams
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
  pollCursor: string | undefined
  api: FeedAPI
  tuner = new FeedTuner()
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
    public feedType: 'home' | 'following' | 'author' | 'custom' | 'likes',
    params: QueryParams,
    options?: Options,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
    this.options = options || {}
    if (feedType === 'home') {
      this.api = new MergeFeedAPI(rootStore)
    } else if (feedType === 'following') {
      this.api = new FollowingFeedAPI(rootStore)
    } else if (feedType === 'author') {
      this.api = new AuthorFeedAPI(
        rootStore,
        params as GetAuthorFeed.QueryParams,
      )
    } else if (feedType === 'likes') {
      this.api = new LikesFeedAPI(
        rootStore,
        params as GetActorLikes.QueryParams,
      )
    } else if (feedType === 'custom') {
      this.api = new CustomFeedAPI(
        rootStore,
        params as GetCustomFeed.QueryParams,
      )
    } else {
      this.api = new FollowingFeedAPI(rootStore)
    }
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
    this.pollCursor = undefined
    this.slices = []
    this.tuner.reset()
  }

  get feedTuners() {
    const areRepliesEnabled = this.rootStore.preferences.homeFeedRepliesEnabled
    const areRepliesByFollowedOnlyEnabled =
      this.rootStore.preferences.homeFeedRepliesByFollowedOnlyEnabled
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
    if (this.feedType === 'home' || this.feedType === 'following') {
      const feedTuners = []

      if (areRepostsEnabled) {
        feedTuners.push(FeedTuner.dedupReposts)
      } else {
        feedTuners.push(FeedTuner.removeReposts)
      }

      if (areRepliesEnabled) {
        feedTuners.push(
          FeedTuner.thresholdRepliesOnly({
            userDid: this.rootStore.session.data?.did || '',
            minLikes: repliesThreshold,
            followedOnly: areRepliesByFollowedOnlyEnabled,
          }),
        )
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
      this.api.reset()
      this.tuner.reset()
      this._xLoading(isRefreshing)
      try {
        const res = await this.api.fetchNext({limit: this.pageSize})
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
        const res = await this.api.fetchNext({
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
   * Check if new posts are available
   */
  async checkForLatest() {
    if (!this.hasLoaded || this.hasNewLatest || this.isLoading) {
      return
    }
    const post = await this.api.peekLatest()
    if (post) {
      const slices = this.tuner.tune([post], this.feedTuners, {
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

  async _replaceAll(res: FeedAPIResponse) {
    this.pollCursor = res.feed[0]?.post.uri
    return this._appendAll(res, true)
  }

  async _appendAll(res: FeedAPIResponse, replace = false) {
    this.hasMore = !!res.cursor
    if (replace) {
      this.emptyFetches = 0
    }

    this.rootStore.me.follows.hydrateProfiles(
      res.feed.map(item => item.post.author),
    )
    for (const item of res.feed) {
      this.rootStore.posts.fromFeedItem(item)
    }

    const slices = this.options.isSimpleFeed
      ? res.feed.map(item => new FeedViewPostsSlice([item]))
      : this.tuner.tune(res.feed, this.feedTuners)

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
}
