import {makeAutoObservable, runInAction} from 'mobx'
import {Record as PostRecord} from '../../third-party/api/src/client/types/app/bsky/feed/post'
import * as GetTimeline from '../../third-party/api/src/client/types/app/bsky/feed/getTimeline'
import * as ActorRef from '../../third-party/api/src/client/types/app/bsky/actor/ref'
import * as GetAuthorFeed from '../../third-party/api/src/client/types/app/bsky/feed/getAuthorFeed'
import {PostThreadViewModel} from './post-thread-view'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'
import {cleanError} from '../../lib/strings'
import {isObj, hasProp} from '../lib/type-guards'

const PAGE_SIZE = 30

let _idCounter = 0

type FeedItem = GetTimeline.FeedItem | GetAuthorFeed.FeedItem
type FeedItemWithThreadMeta = FeedItem & {
  _isThreadParent?: boolean
  _isThreadChildElided?: boolean
  _isThreadChild?: boolean
}

export class FeedItemMyStateModel {
  repost?: string
  upvote?: string
  downvote?: string

  constructor() {
    makeAutoObservable(this)
  }
}

export class FeedItemModel implements GetTimeline.FeedItem {
  // ui state
  _reactKey: string = ''
  _isThreadParent: boolean = false
  _isThreadChildElided: boolean = false
  _isThreadChild: boolean = false

  // data
  uri: string = ''
  cid: string = ''
  author: ActorRef.WithInfo = {
    did: '',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
    avatar: undefined,
  }
  repostedBy?: ActorRef.WithInfo
  trendedBy?: ActorRef.WithInfo
  record: Record<string, unknown> = {}
  embed?: GetTimeline.FeedItem['embed']
  replyCount: number = 0
  repostCount: number = 0
  upvoteCount: number = 0
  downvoteCount: number = 0
  indexedAt: string = ''
  myState = new FeedItemMyStateModel()

  // additional data
  additionalParentPost?: PostThreadViewModel

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: FeedItemWithThreadMeta,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
    this._isThreadParent = v._isThreadParent || false
    this._isThreadChild = v._isThreadChild || false
    this._isThreadChildElided = v._isThreadChildElided || false
  }

  copy(v: GetTimeline.FeedItem | GetAuthorFeed.FeedItem) {
    this.uri = v.uri
    this.cid = v.cid
    this.author = v.author
    this.repostedBy = v.repostedBy
    this.trendedBy = v.trendedBy
    this.record = v.record
    this.embed = v.embed
    this.replyCount = v.replyCount
    this.repostCount = v.repostCount
    this.upvoteCount = v.upvoteCount
    this.downvoteCount = v.downvoteCount
    this.indexedAt = v.indexedAt
    if (v.myState) {
      this.myState.upvote = v.myState.upvote
      this.myState.downvote = v.myState.downvote
      this.myState.repost = v.myState.repost
    }
  }

  async toggleUpvote() {
    const wasUpvoted = !!this.myState.upvote
    const wasDownvoted = !!this.myState.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.uri,
        cid: this.cid,
      },
      direction: wasUpvoted ? 'none' : 'up',
    })
    runInAction(() => {
      if (wasDownvoted) {
        this.downvoteCount--
      }
      if (wasUpvoted) {
        this.upvoteCount--
      } else {
        this.upvoteCount++
      }
      this.myState.upvote = res.data.upvote
      this.myState.downvote = res.data.downvote
    })
  }

  async toggleDownvote() {
    const wasUpvoted = !!this.myState.upvote
    const wasDownvoted = !!this.myState.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.uri,
        cid: this.cid,
      },
      direction: wasDownvoted ? 'none' : 'down',
    })
    runInAction(() => {
      if (wasUpvoted) {
        this.upvoteCount--
      }
      if (wasDownvoted) {
        this.downvoteCount--
      } else {
        this.downvoteCount++
      }
      this.myState.upvote = res.data.upvote
      this.myState.downvote = res.data.downvote
    })
  }

  async toggleRepost() {
    if (this.myState.repost) {
      await apilib.unrepost(this.rootStore, this.myState.repost)
      runInAction(() => {
        this.repostCount--
        this.myState.repost = undefined
      })
    } else {
      const res = await apilib.repost(this.rootStore, this.uri, this.cid)
      runInAction(() => {
        this.repostCount++
        this.myState.repost = res.uri
      })
    }
  }

  async delete() {
    await this.rootStore.api.app.bsky.feed.post.delete({
      did: this.author.did,
      rkey: new AtUri(this.uri).rkey,
    })
  }

  get needsAdditionalData() {
    if (
      (this.record as PostRecord).reply?.parent?.uri &&
      !this._isThreadChild
    ) {
      return !this.additionalParentPost
    }
    return false
  }

  async fetchAdditionalData() {
    if (!this.needsAdditionalData) {
      return
    }
    this.additionalParentPost = new PostThreadViewModel(this.rootStore, {
      uri: (this.record as PostRecord).reply?.parent.uri,
      depth: 0,
    })
    await this.additionalParentPost.setup().catch(e => {
      console.error('Failed to load post needed by notification', e)
    })
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
  _loadPromise: Promise<void> | undefined
  _loadMorePromise: Promise<void> | undefined
  _loadLatestPromise: Promise<void> | undefined
  _updatePromise: Promise<void> | undefined

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
        _loadPromise: false,
        _loadMorePromise: false,
        _loadLatestPromise: false,
        _updatePromise: false,
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
    return this.feed.filter(
      post =>
        !post.record.reply || // not a reply
        !!post.repostedBy || // or a repost
        !!post.trendedBy || // or a trend
        post._isThreadParent || // but allow if it's a thread by the user
        post._isThreadChild,
    )
  }

  setHasNewLatest(v: boolean) {
    this.hasNewLatest = v
  }

  // public api
  // =

  /**
   * Load for first render
   */
  async setup(isRefreshing = false) {
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    if (this._loadPromise) {
      return this._loadPromise
    }
    await this._pendingWork()
    this.setHasNewLatest(false)
    this._loadPromise = this._initialLoad(isRefreshing)
    await this._loadPromise
    this._loadPromise = undefined
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
  async loadMore() {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    await this._pendingWork()
    this._loadMorePromise = this._loadMore()
    await this._loadMorePromise
    this._loadMorePromise = undefined
  }

  /**
   * Load more posts to the start of the feed
   */
  async loadLatest() {
    if (this._loadLatestPromise) {
      return this._loadLatestPromise
    }
    await this._pendingWork()
    this.setHasNewLatest(false)
    this._loadLatestPromise = this._loadLatest()
    await this._loadLatestPromise
    this._loadLatestPromise = undefined
  }

  /**
   * Update content in-place
   */
  async update() {
    if (this._updatePromise) {
      return this._updatePromise
    }
    await this._pendingWork()
    this._updatePromise = this._update()
    await this._updatePromise
    this._updatePromise = undefined
  }

  /**
   * Check if new postrs are available
   */
  async checkForLatest() {
    if (this.hasNewLatest) {
      return
    }
    await this._pendingWork()
    const res = await this._getFeed({limit: 1})
    const currentLatestUri = this.pollCursor
    const receivedLatestUri = res.data.feed[0]
      ? res.data.feed[0].uri
      : undefined
    const hasNewLatest = Boolean(
      receivedLatestUri &&
        (this.feed.length === 0 || receivedLatestUri !== currentLatestUri),
    )
    this.setHasNewLatest(hasNewLatest)
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
  }

  // loader functions
  // =

  private async _pendingWork() {
    if (this._loadPromise) {
      await this._loadPromise
    }
    if (this._loadMorePromise) {
      await this._loadMorePromise
    }
    if (this._loadLatestPromise) {
      await this._loadLatestPromise
    }
    if (this._updatePromise) {
      await this._updatePromise
    }
  }

  private async _initialLoad(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this._getFeed({limit: PAGE_SIZE})
      await this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private async _loadLatest() {
    this._xLoading()
    try {
      const res = await this._getFeed({limit: PAGE_SIZE})
      await this._prependAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private async _loadMore() {
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
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _update() {
    if (!this.feed.length) {
      return
    }
    this._xLoading()
    let numToFetch = this.feed.length
    let cursor = undefined
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
        cursor = this.feed[res.data.feed.length - 1].indexedAt
        console.log(numToFetch, cursor, res.data.feed.length)
      } while (numToFetch > 0)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to update feed: ${e.toString()}`)
    }
  }

  private async _replaceAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.uri
    return this._appendAll(res, true)
  }

  private async _appendAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
    replace = false,
  ) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor

    const reorgedFeed = preprocessFeed(res.data.feed)

    const promises = []
    const toAppend: FeedItemModel[] = []
    for (const item of reorgedFeed) {
      const itemModel = new FeedItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      if (itemModel.needsAdditionalData) {
        promises.push(
          itemModel.fetchAdditionalData().catch(e => {
            console.error('Failure during feed-view _appendAll()', e)
          }),
        )
      }
      toAppend.push(itemModel)
    }
    await Promise.all(promises)
    runInAction(() => {
      if (replace) {
        this.feed = toAppend
      } else {
        this.feed = this.feed.concat(toAppend)
      }
    })
  }

  private async _prependAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
  ) {
    this.pollCursor = res.data.feed[0]?.uri

    const promises = []
    const toPrepend: FeedItemModel[] = []
    for (const item of res.data.feed) {
      if (this.feed.find(item2 => item2.uri === item.uri)) {
        break // stop here - we've hit a post we already have
      }

      const itemModel = new FeedItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      if (itemModel.needsAdditionalData) {
        promises.push(
          itemModel.fetchAdditionalData().catch(e => {
            console.error('Failure during feed-view _prependAll()', e)
          }),
        )
      }
      toPrepend.push(itemModel)
    }
    await Promise.all(promises)
    runInAction(() => {
      this.feed = toPrepend.concat(this.feed)
    })
  }

  private _updateAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    for (const item of res.data.feed) {
      const existingItem = this.feed.find(
        // HACK: need to find the reposts and trends item, so we have to check for that -prf
        item2 =>
          item.uri === item2.uri &&
          item.repostedBy?.did === item2.repostedBy?.did &&
          item.trendedBy?.did === item2.trendedBy?.did,
      )
      if (existingItem) {
        existingItem.copy(item)
      }
    }
  }

  protected _getFeed(
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams = {},
  ): Promise<GetTimeline.Response | GetAuthorFeed.Response> {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'home') {
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
function preprocessFeed(feed: FeedItem[]): FeedItemWithThreadMeta[] {
  const reorg: FeedItemWithThreadMeta[] = []

  // phase one: identify threads and reorganize them into the feed so
  // that they are in order and marked as part of a thread
  for (let i = feed.length - 1; i >= 0; i--) {
    const item = feed[i] as FeedItemWithThreadMeta

    const selfReplyUri = getSelfReplyUri(item)
    if (selfReplyUri) {
      const parentIndex = reorg.findIndex(item2 => item2.uri === selfReplyUri)
      if (parentIndex !== -1 && !reorg[parentIndex]._isThreadParent) {
        reorg[parentIndex]._isThreadParent = true
        item._isThreadChild = true
        reorg.splice(parentIndex + 1, 0, item)
        continue
      }
    }
    reorg.unshift(item)
  }

  // phase two: identify the positions of the threads
  let activeSlice = -1
  let threadSlices: Slice[] = []
  for (let i = 0; i < reorg.length; i++) {
    const item = reorg[i] as FeedItemWithThreadMeta
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
    threadSlices.push({index: activeSlice, length: reorg.length - activeSlice})
  }

  // phase three: reorder the feed so that the timestamp of the
  // last post in a thread establishes its ordering
  for (const slice of threadSlices) {
    const removed: FeedItemWithThreadMeta[] = reorg.splice(
      slice.index,
      slice.length,
    )
    const targetDate = new Date(removed[removed.length - 1].indexedAt)
    let newIndex = reorg.findIndex(
      item => new Date(item.indexedAt) < targetDate,
    )
    if (newIndex === -1) {
      newIndex = reorg.length
    }
    reorg.splice(newIndex, 0, ...removed)
    slice.index = newIndex
  }

  // phase four: compress any threads that are longer than 3 posts
  let removedCount = 0
  for (const slice of threadSlices) {
    if (slice.length > 3) {
      reorg.splice(slice.index - removedCount + 1, slice.length - 3)
      reorg[slice.index - removedCount]._isThreadChildElided = true
      removedCount += slice.length - 3
    }
  }

  return reorg
}

function getSelfReplyUri(
  item: GetTimeline.FeedItem | GetAuthorFeed.FeedItem,
): string | undefined {
  if (
    isObj(item.record) &&
    hasProp(item.record, 'reply') &&
    isObj(item.record.reply) &&
    hasProp(item.record.reply, 'parent') &&
    isObj(item.record.reply.parent) &&
    hasProp(item.record.reply.parent, 'uri') &&
    typeof item.record.reply.parent.uri === 'string'
  ) {
    if (new AtUri(item.record.reply.parent.uri).host === item.author.did) {
      return item.record.reply.parent.uri
    }
  }
}
