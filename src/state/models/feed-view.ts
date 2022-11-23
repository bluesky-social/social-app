import {makeAutoObservable, runInAction} from 'mobx'
import * as GetTimeline from '../../third-party/api/src/client/types/app/bsky/feed/getTimeline'
import * as GetAuthorFeed from '../../third-party/api/src/client/types/app/bsky/feed/getAuthorFeed'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'
import {cleanError} from '../../lib/strings'
import {isObj, hasProp} from '../lib/type-guards'

type FeedItem = GetTimeline.FeedItem | GetAuthorFeed.FeedItem
type FeedItemWithThreadMeta = FeedItem & {
  _isThreadParent?: boolean
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
  _isThreadChild: boolean = false

  // data
  uri: string = ''
  cid: string = ''
  author: GetTimeline.Actor = {
    did: '',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
  }
  repostedBy?: GetTimeline.Actor
  trendedBy?: GetTimeline.Actor
  record: Record<string, unknown> = {}
  embed?:
    | GetTimeline.RecordEmbed
    | GetTimeline.ExternalEmbed
    | GetTimeline.UnknownEmbed
  replyCount: number = 0
  repostCount: number = 0
  upvoteCount: number = 0
  downvoteCount: number = 0
  indexedAt: string = ''
  myState = new FeedItemMyStateModel()

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
      post => !post.record.reply || post._isThreadParent || post._isThreadChild,
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
    return this.setup(true)
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
    this.setHasNewLatest(
      res.data.feed[0] &&
        (this.feed.length === 0 || res.data.feed[0].uri !== this.feed[0]?.uri),
    )
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
      const res = await this._getFeed()
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private async _loadLatest() {
    this._xLoading()
    try {
      const res = await this._getFeed()
      this._prependAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private async _loadMore() {
    if (!this.hasMore) {
      return
    }
    this._xLoading()
    try {
      const res = await this._getFeed({
        before: this.loadMoreCursor,
      })
      this._appendAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _update() {
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

  private _replaceAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    this.feed.length = 0
    this._appendAll(res)
  }

  private _appendAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    let counter = this.feed.length

    // HACK 1
    // rearrange the posts to represent threads
    // (should be done on the server)
    // -prf
    // HACK 2
    // deduplicate posts on the home feed
    // (should be done on the server)
    // -prf
    const reorgedFeed = preprocessFeed(res.data.feed, this.feedType === 'home')

    for (const item of reorgedFeed) {
      this._append(counter++, item)
    }
  }

  private _append(
    keyId: number,
    item: GetTimeline.FeedItem | GetAuthorFeed.FeedItem,
  ) {
    // TODO: validate .record
    this.feed.push(new FeedItemModel(this.rootStore, `item-${keyId}`, item))
  }

  private _prependAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    let counter = this.feed.length
    const toPrepend = []
    for (const item of res.data.feed) {
      if (this.feed.find(item2 => item2.uri === item.uri)) {
        break // stop here - we've hit a post we already have
      }
      toPrepend.unshift(item) // reverse the order
    }
    for (const item of toPrepend) {
      this._prepend(counter++, item)
    }
  }

  private _prepend(
    keyId: number,
    item: GetTimeline.FeedItem | GetAuthorFeed.FeedItem,
  ) {
    // TODO: validate .record
    this.feed.unshift(new FeedItemModel(this.rootStore, `item-${keyId}`, item))
  }

  private _updateAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    for (const item of res.data.feed) {
      const existingItem = this.feed.find(
        // this find function has a key subtley- the indexedAt comparison
        // the reason for this is reposts: they set the URI of the original post, not of the repost record
        // the indexedAt time will be for the repost however, so we use that to help us
        item2 => item.uri === item2.uri && item.indexedAt === item2.indexedAt,
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

function preprocessFeed(
  feed: FeedItem[],
  dedup: boolean,
): FeedItemWithThreadMeta[] {
  const reorg: FeedItemWithThreadMeta[] = []
  for (let i = feed.length - 1; i >= 0; i--) {
    const item = feed[i] as FeedItemWithThreadMeta

    if (dedup) {
      if (reorg.find(item2 => item2.uri === item.uri)) {
        continue
      }
    }

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
