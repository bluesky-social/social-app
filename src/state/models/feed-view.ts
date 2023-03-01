import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedFeedViewPost,
  AppBskyFeedPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
type FeedViewPost = AppBskyFeedFeedViewPost.Main
type ReasonRepost = AppBskyFeedFeedViewPost.ReasonRepost
type PostView = AppBskyFeedPost.View
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {RichText} from 'lib/strings/rich-text'
import {
  getMultipleAuthorsPostsAsPromise,
  mergeAndFilterMultipleAuthorPostsIntoOneFeed,
} from 'lib/api/build-suggested-posts'

const PAGE_SIZE = 30

let _idCounter = 0

type FeedViewPostWithThreadMeta = FeedViewPost & {
  _isThreadParent?: boolean
  _isThreadChildElided?: boolean
  _isThreadChild?: boolean
}

export class FeedItemModel {
  // ui state
  _reactKey: string = ''
  _isThreadParent: boolean = false
  _isThreadChildElided: boolean = false
  _isThreadChild: boolean = false
  _hideParent: boolean = true // used to avoid dup post rendering while showing some parents

  // data
  post: PostView
  postRecord?: AppBskyFeedPost.Record
  reply?: FeedViewPost['reply']
  replyParent?: FeedItemModel
  reason?: FeedViewPost['reason']
  richText?: RichText

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: FeedViewPostWithThreadMeta,
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
    if (v.reply?.parent) {
      this.replyParent = new FeedItemModel(rootStore, '', {
        post: v.reply.parent,
      })
    }
    this.reason = v.reason
    this._isThreadParent = v._isThreadParent || false
    this._isThreadChild = v._isThreadChild || false
    this._isThreadChildElided = v._isThreadChildElided || false
    makeAutoObservable(this, {rootStore: false})
  }

  copy(v: FeedViewPost) {
    this.post = v.post
    this.reply = v.reply
    if (v.reply?.parent) {
      this.replyParent = new FeedItemModel(this.rootStore, '', {
        post: v.reply.parent,
      })
    } else {
      this.replyParent = undefined
    }
    this.reason = v.reason
  }

  get _isRenderingAsThread() {
    return (
      this._isThreadParent || this._isThreadChild || this._isThreadChildElided
    )
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

  // used to linearize async modifications to state
  private lock = new AwaitLock()

  // data
  feed: FeedItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author',
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
    return this.feed.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get nonReplyFeed() {
    const nonReplyFeed = this.feed.filter(item => {
      const params = this.params as GetAuthorFeed.QueryParams
      const isRepost =
        item.reply &&
        (item?.reasonRepost?.by?.handle === params.author ||
          item?.reasonRepost?.by?.did === params.author)

      return (
        !item.reply || // not a reply
        isRepost ||
        ((item._isThreadParent || // but allow if it's a thread by the user
          item._isThreadChild) &&
          item.reply?.root.author.did === item.post.author.did)
      )
    })
    return nonReplyFeed
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
    this.feed = []
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
      if (!this.feed.length) {
        return
      }
      this._xLoading()
      let numToFetch = this.feed.length
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
    if (this.hasNewLatest) {
      return
    }
    const res = await this._getFeed({limit: 1})
    const currentLatestUri = this.pollCursor
    const item = res.data.feed[0]
    if (!item) {
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
      i = this.feed.findIndex(item => item.post.uri === uri)
      if (i !== -1) {
        this.feed.splice(i, 1)
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
    const orgLen = this.feed.length

    const reorgedFeed = preprocessFeed(res.data.feed)

    const toAppend: FeedItemModel[] = []
    for (const item of reorgedFeed) {
      const itemModel = new FeedItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      toAppend.push(itemModel)
    }
    runInAction(() => {
      if (replace) {
        this.feed = toAppend
      } else {
        this.feed = this.feed.concat(toAppend)
      }
      dedupReposts(this.feed)
      dedupParents(this.feed.slice(orgLen)) // we slice to avoid modifying rendering of already-shown posts
    })
  }

  private async _prependAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.post.uri

    const toPrepend: FeedItemModel[] = []
    for (const item of res.data.feed) {
      if (this.feed.find(item2 => item2.post.uri === item.post.uri)) {
        break // stop here - we've hit a post we already have
      }

      const itemModel = new FeedItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      toPrepend.push(itemModel)
    }
    runInAction(() => {
      this.feed = toPrepend.concat(this.feed)
    })
  }

  private _updateAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    for (const item of res.data.feed) {
      const existingItem = this.feed.find(
        // HACK: need to find the reposts' item, so we have to check for that -prf
        item2 =>
          item.post.uri === item2.post.uri &&
          // @ts-ignore todo
          item.reason?.by?.did === item2.reason?.by?.did,
      )
      if (existingItem) {
        existingItem.copy(item)
      }
    }
  }

  protected async _getFeed(
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams = {},
  ): Promise<GetTimeline.Response | GetAuthorFeed.Response> {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'home') {
      await this.rootStore.me.follows.fetchIfNeeded()
      if (this.rootStore.me.follows.isEmpty()) {
        const response = await getMultipleAuthorsPostsAsPromise(this.rootStore)
        const finalData = await mergeAndFilterMultipleAuthorPostsIntoOneFeed(
          this.rootStore,
          response,
        )
        const lastHeaders = response[response.length - 1].headers
        return {
          success: true,
          data: {
            feed: finalData as any,
          },
          headers: lastHeaders,
        }
      }
      return this.rootStore.api.app.bsky.feed.getTimeline(
        params as GetTimeline.QueryParams,
      )
    } else {
      return this.rootStore.api.app.bsky.feed.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    }
  }
}

interface Slice {
  index: number
  length: number
}
function preprocessFeed(feed: FeedViewPost[]): FeedViewPostWithThreadMeta[] {
  const reorg: FeedViewPostWithThreadMeta[] = []

  // phase one: identify threads and reorganize them into the feed so
  // that they are in order and marked as part of a thread
  for (let i = feed.length - 1; i >= 0; i--) {
    const item = feed[i] as FeedViewPostWithThreadMeta

    const selfReplyUri = getSelfReplyUri(item)
    if (selfReplyUri) {
      const parentIndex = reorg.findIndex(
        item2 => item2.post.uri === selfReplyUri,
      )
      if (parentIndex !== -1 && !reorg[parentIndex]._isThreadParent) {
        reorg[parentIndex]._isThreadParent = true
        item._isThreadChild = true
        reorg.splice(parentIndex + 1, 0, item)
        continue
      }
    }
    reorg.unshift(item)
  }

  // phase two: reorder the feed so that the timestamp of the
  // last post in a thread establishes its ordering
  let threadSlices: Slice[] = identifyThreadSlices(reorg)
  for (const slice of threadSlices) {
    const removed: FeedViewPostWithThreadMeta[] = reorg.splice(
      slice.index,
      slice.length,
    )
    const targetDate = new Date(ts(removed[removed.length - 1]))
    let newIndex = reorg.findIndex(item => new Date(ts(item)) < targetDate)
    if (newIndex === -1) {
      newIndex = reorg.length
    }
    reorg.splice(newIndex, 0, ...removed)
    slice.index = newIndex
  }

  // phase three: compress any threads that are longer than 3 posts
  let removedCount = 0
  // phase 2 moved posts around, so we need to re-identify the slice indices
  threadSlices = identifyThreadSlices(reorg)
  for (const slice of threadSlices) {
    if (slice.length > 3) {
      reorg.splice(slice.index - removedCount + 1, slice.length - 3)
      if (reorg[slice.index - removedCount]) {
        // ^ sanity check
        reorg[slice.index - removedCount]._isThreadChildElided = true
      }
      removedCount += slice.length - 3
    }
  }

  return reorg
}

function identifyThreadSlices(feed: FeedViewPost[]): Slice[] {
  let activeSlice = -1
  let threadSlices: Slice[] = []
  for (let i = 0; i < feed.length; i++) {
    const item = feed[i] as FeedViewPostWithThreadMeta
    if (activeSlice === -1) {
      if (item._isThreadParent) {
        activeSlice = i
      }
    } else {
      if (!item._isThreadChild) {
        threadSlices.push({index: activeSlice, length: i - activeSlice})
        if (item._isThreadParent) {
          activeSlice = i
        } else {
          activeSlice = -1
        }
      }
    }
  }
  if (activeSlice !== -1) {
    threadSlices.push({index: activeSlice, length: feed.length - activeSlice})
  }
  return threadSlices
}

// WARNING: mutates `feed`
function dedupReposts(feed: FeedItemModel[]) {
  // remove duplicates caused by reposts
  for (let i = 0; i < feed.length; i++) {
    const item1 = feed[i]
    for (let j = i + 1; j < feed.length; j++) {
      const item2 = feed[j]
      if (item2._isRenderingAsThread) {
        // dont dedup items that are rendering in a thread as this can cause rendering errors
        continue
      }
      if (item1.post.uri === item2.post.uri) {
        feed.splice(j, 1)
        j--
      }
    }
  }
}

// WARNING: mutates `feed`
function dedupParents(feed: FeedItemModel[]) {
  // only show parents that aren't already in the feed
  for (let i = 0; i < feed.length; i++) {
    const item1 = feed[i]
    if (!item1.replyParent || item1._isThreadChild) {
      continue
    }
    let hideParent = false
    for (let j = 0; j < feed.length; j++) {
      const item2 = feed[j]
      if (
        item1.replyParent.post.uri === item2.post.uri || // the post itself is there
        (j < i && item1.replyParent.post.uri === item2.replyParent?.post.uri) // another reply already showed it
      ) {
        hideParent = true
        break
      }
    }
    item1._hideParent = hideParent
  }
}

function getSelfReplyUri(item: FeedViewPost): string | undefined {
  return item.reply?.parent.author.did === item.post.author.did
    ? item.reply?.parent.uri
    : undefined
}

function ts(item: FeedViewPost | FeedItemModel): string {
  if (item.reason?.indexedAt) {
    // @ts-ignore need better type checks
    return item.reason.indexedAt
  }
  return item.post.indexedAt
}
