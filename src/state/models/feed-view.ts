import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedFeedViewPost,
  AppBskyFeedPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import sampleSize from 'lodash.samplesize'
type FeedViewPost = AppBskyFeedFeedViewPost.Main
type ReasonRepost = AppBskyFeedFeedViewPost.ReasonRepost
type PostView = AppBskyFeedPost.View
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {RichText} from 'lib/strings/rich-text'
import {SUGGESTED_FOLLOWS} from 'lib/constants'
import {
  getCombinedCursors,
  getMultipleAuthorsPosts,
  mergePosts,
} from 'lib/api/build-suggested-posts'

import {FeedTuner, FeedViewPostsSlice} from 'lib/api/feed-manip'

const PAGE_SIZE = 30

let _idCounter = 0

export class FeedItemModel {
  // ui state
  _reactKey: string = ''

  // data
  post: PostView
  postRecord?: AppBskyFeedPost.Record
  reply?: FeedViewPost['reply']
  reason?: FeedViewPost['reason']
  richText?: RichText

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: FeedViewPost,
  ) {
    this._reactKey = reactKey
    this.post = v.post
    if (AppBskyFeedPost.isRecord(this.post.record)) {
      const valid = AppBskyFeedPost.validateRecord(this.post.record)
      if (valid.success) {
        this.postRecord = this.post.record
        this.richText = new RichText(
          this.postRecord.text,
          this.postRecord.entities,
          {cleanNewlines: true},
        )
      } else {
        rootStore.log.warn(
          'Received an invalid app.bsky.feed.post record',
          valid.error,
        )
      }
    } else {
      rootStore.log.warn(
        'app.bsky.feed.getTimeline or app.bsky.feed.getAuthorFeed served an unexpected record type',
        this.post.record,
      )
    }
    this.reply = v.reply
    this.reason = v.reason
    makeAutoObservable(this, {rootStore: false})
  }

  copy(v: FeedViewPost) {
    this.post = v.post
    this.reply = v.reply
    this.reason = v.reason
  }

  copyMetrics(v: FeedViewPost) {
    this.post.replyCount = v.post.replyCount
    this.post.repostCount = v.post.repostCount
    this.post.upvoteCount = v.post.upvoteCount
    this.post.viewer = v.post.viewer
  }

  get reasonRepost(): ReasonRepost | undefined {
    if (this.reason?.$type === 'app.bsky.feed.feedViewPost#reasonRepost') {
      return this.reason as ReasonRepost
    }
  }

  async toggleUpvote() {
    const wasUpvoted = !!this.post.viewer.upvote
    const wasDownvoted = !!this.post.viewer.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.post.uri,
        cid: this.post.cid,
      },
      direction: wasUpvoted ? 'none' : 'up',
    })
    runInAction(() => {
      if (wasDownvoted) {
        this.post.downvoteCount--
      }
      if (wasUpvoted) {
        this.post.upvoteCount--
      } else {
        this.post.upvoteCount++
      }
      this.post.viewer.upvote = res.data.upvote
      this.post.viewer.downvote = res.data.downvote
    })
  }

  async toggleDownvote() {
    const wasUpvoted = !!this.post.viewer.upvote
    const wasDownvoted = !!this.post.viewer.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.post.uri,
        cid: this.post.cid,
      },
      direction: wasDownvoted ? 'none' : 'down',
    })
    runInAction(() => {
      if (wasUpvoted) {
        this.post.upvoteCount--
      }
      if (wasDownvoted) {
        this.post.downvoteCount--
      } else {
        this.post.downvoteCount++
      }
      this.post.viewer.upvote = res.data.upvote
      this.post.viewer.downvote = res.data.downvote
    })
  }

  async toggleRepost() {
    if (this.post.viewer.repost) {
      await apilib.unrepost(this.rootStore, this.post.viewer.repost)
      runInAction(() => {
        this.post.repostCount--
        this.post.viewer.repost = undefined
      })
    } else {
      const res = await apilib.repost(
        this.rootStore,
        this.post.uri,
        this.post.cid,
      )
      runInAction(() => {
        this.post.repostCount++
        this.post.viewer.repost = res.uri
      })
    }
  }

  async delete() {
    await this.rootStore.api.app.bsky.feed.post.delete({
      did: this.post.author.did,
      rkey: new AtUri(this.post.uri).rkey,
    })
    this.rootStore.emitPostDeleted(this.post.uri)
  }
}

export class FeedSliceModel {
  // ui state
  _reactKey: string = ''

  // data
  items: FeedItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    slice: FeedViewPostsSlice,
  ) {
    this._reactKey = reactKey
    for (const item of slice.items) {
      this.items.push(
        new FeedItemModel(rootStore, `item-${_idCounter++}`, item),
      )
    }
    makeAutoObservable(this, {rootStore: false})
  }

  get uri() {
    if (this.isReply) {
      return this.items[1].post.uri
    }
    return this.items[0].post.uri
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
  }

  get isReply() {
    return this.items.length === 2 && !this.isThread
  }

  get rootItem() {
    if (this.isReply) {
      return this.items[1]
    }
    return this.items[0]
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isThreadParentAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i < this.items.length - 1
  }

  isThreadChildAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i > 0
  }
}

export class FeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasNewLatest = false
  hasLoaded = false
  error = ''
  params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams
  hasMore = true
  loadMoreCursor: string | undefined
  pollCursor: string | undefined
  tuner = new FeedTuner()

  // used to linearize async modifications to state
  private lock = new AwaitLock()

  // data
  slices: FeedSliceModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author' | 'suggested' | 'goodstuff',
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams,
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
          item?.reasonRepost?.by?.handle === params.author ||
          item?.reasonRepost?.by?.did === params.author
        return (
          !item.reply || // not a reply
          isRepost || // but allow if it's a repost
          (slice.isThread && // or a thread by the user
            item.reply?.root.author.did === item.post.author.did)
        )
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
        const res = await this._getFeed({limit: PAGE_SIZE})
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
          before: this.loadMoreCursor,
          limit: PAGE_SIZE,
        })
        await this._appendAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('FeedView: Failed to load more', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Load more posts to the start of the feed
   */
  loadLatest = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      this.setHasNewLatest(false)
      this._xLoading()
      try {
        const res = await this._getFeed({limit: PAGE_SIZE})
        await this._prependAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('FeedView: Failed to load latest', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

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
            before: cursor,
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
    const res = await this._getFeed({limit: 1})
    const currentLatestUri = this.pollCursor
    const item = res.data.feed[0]
    if (!item) {
      return
    }
    if (item.reply) {
      // TEMPORARY ignore replies
      return
    }
    if (AppBskyFeedFeedViewPost.isReasonRepost(item.reason)) {
      if (item.reason.by.did === this.rootStore.me.did) {
        return // ignore reposts by the user
      }
    }
    this.setHasNewLatest(item.post.uri !== currentLatestUri)
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

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Posts feed request failed', err)
    }
  }

  // helper functions
  // =

  private async _replaceAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.post.uri
    return this._appendAll(res, true)
  }

  private async _appendAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
    replace = false,
  ) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor

    const slices = this.tuner.tune(
      res.data.feed,
      this.feedType === 'home'
        ? [FeedTuner.dedupReposts, FeedTuner.likedRepliesOnly]
        : [],
    )

    const toAppend: FeedSliceModel[] = []
    for (const slice of slices) {
      const sliceModel = new FeedSliceModel(
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
    })
  }

  private async _prependAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.post.uri

    const slices = this.tuner.tune(
      res.data.feed,
      this.feedType === 'home'
        ? [FeedTuner.dedupReposts, FeedTuner.likedRepliesOnly]
        : [],
    )

    const toPrepend: FeedSliceModel[] = []
    for (const slice of slices) {
      const itemModel = new FeedSliceModel(
        this.rootStore,
        `item-${_idCounter++}`,
        slice,
      )
      toPrepend.push(itemModel)
    }
    runInAction(() => {
      this.slices = toPrepend.concat(this.slices)
    })
  }

  private _updateAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
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
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams = {},
  ): Promise<GetTimeline.Response | GetAuthorFeed.Response> {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'suggested') {
      const responses = await getMultipleAuthorsPosts(
        this.rootStore,
        sampleSize(SUGGESTED_FOLLOWS(String(this.rootStore.agent.service)), 20),
        params.before,
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
      return this.rootStore.api.app.bsky.feed.getTimeline(
        params as GetTimeline.QueryParams,
      )
    } else if (this.feedType === 'goodstuff') {
      const res = await this.rootStore.api.app.bsky.feed.getAuthorFeed({
        ...params,
        author: 'jay.bsky.social',
      } as GetAuthorFeed.QueryParams)
      res.data.feed = mergePosts([res], {repostsOnly: true})
      res.data.feed.forEach(item => {
        delete item.reason
      })
      return res
    } else {
      return this.rootStore.api.app.bsky.feed.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    }
  }
}
