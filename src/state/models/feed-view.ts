import {makeAutoObservable, runInAction} from 'mobx'
import * as GetHomeFeed from '../../third-party/api/src/types/app/bsky/getHomeFeed'
import * as GetAuthorFeed from '../../third-party/api/src/types/app/bsky/getAuthorFeed'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

export class FeedItemMyStateModel {
  repost?: string
  like?: string

  constructor() {
    makeAutoObservable(this)
  }
}

export class FeedItemModel implements GetHomeFeed.FeedItem {
  // ui state
  _reactKey: string = ''

  // data
  cursor: string = ''
  uri: string = ''
  author: GetHomeFeed.User = {did: '', name: '', displayName: ''}
  repostedBy?: GetHomeFeed.User
  record: Record<string, unknown> = {}
  embed?:
    | GetHomeFeed.RecordEmbed
    | GetHomeFeed.ExternalEmbed
    | GetHomeFeed.UnknownEmbed
  replyCount: number = 0
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''
  myState = new FeedItemMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GetHomeFeed.FeedItem | GetAuthorFeed.FeedItem,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
  }

  copy(v: GetHomeFeed.FeedItem | GetAuthorFeed.FeedItem) {
    this.cursor = v.cursor
    this.uri = v.uri
    this.author = v.author
    this.repostedBy = v.repostedBy
    this.record = v.record
    this.embed = v.embed
    this.replyCount = v.replyCount
    this.repostCount = v.repostCount
    this.likeCount = v.likeCount
    this.indexedAt = v.indexedAt
    if (v.myState) {
      this.myState.like = v.myState.like
      this.myState.repost = v.myState.repost
    }
  }

  async toggleLike() {
    if (this.myState.like) {
      await apilib.unlike(this.rootStore, this.myState.like)
      runInAction(() => {
        this.likeCount--
        this.myState.like = undefined
      })
    } else {
      const res = await apilib.like(this.rootStore, this.uri)
      runInAction(() => {
        this.likeCount++
        this.myState.like = res.uri
      })
    }
  }

  async toggleRepost() {
    if (this.myState.repost) {
      await apilib.unrepost(this.rootStore, this.myState.repost)
      runInAction(() => {
        this.repostCount--
        this.myState.repost = undefined
      })
    } else {
      const res = await apilib.repost(this.rootStore, this.uri)
      runInAction(() => {
        this.repostCount++
        this.myState.repost = res.uri
      })
    }
  }
}

export class FeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  hasReachedEnd = false
  error = ''
  params: GetHomeFeed.QueryParams | GetAuthorFeed.QueryParams
  _loadPromise: Promise<void> | undefined
  _loadMorePromise: Promise<void> | undefined
  _loadLatestPromise: Promise<void> | undefined
  _updatePromise: Promise<void> | undefined

  // data
  feed: FeedItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author',
    params: GetHomeFeed.QueryParams | GetAuthorFeed.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
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

  get loadMoreCursor() {
    if (this.hasContent) {
      return this.feed[this.feed.length - 1].cursor
    }
    return undefined
  }

  // public api
  // =

  /**
   * Load for first render
   */
  async setup(isRefreshing = false) {
    if (this._loadPromise) {
      return this._loadPromise
    }
    await this._pendingWork()
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
    this.error = err
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
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _loadLatest() {
    this._xLoading()
    try {
      const res = await this._getFeed()
      this._prependAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _loadMore() {
    this._xLoading()
    try {
      const res = await this._getFeed({
        before: this.loadMoreCursor,
      })
      if (res.data.feed.length === 0) {
        runInAction(() => {
          this.hasReachedEnd = true
        })
      } else {
        this._appendAll(res)
      }
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
        const res: GetHomeFeed.Response = await this._getFeed({
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

  private _replaceAll(res: GetHomeFeed.Response | GetAuthorFeed.Response) {
    this.feed.length = 0
    this.hasReachedEnd = false
    this._appendAll(res)
  }

  private _appendAll(res: GetHomeFeed.Response | GetAuthorFeed.Response) {
    let counter = this.feed.length
    for (const item of res.data.feed) {
      this._append(counter++, item)
    }
  }

  private _append(
    keyId: number,
    item: GetHomeFeed.FeedItem | GetAuthorFeed.FeedItem,
  ) {
    // TODO: validate .record
    this.feed.push(new FeedItemModel(this.rootStore, `item-${keyId}`, item))
  }

  private _prependAll(res: GetHomeFeed.Response | GetAuthorFeed.Response) {
    let counter = this.feed.length
    for (const item of res.data.feed) {
      if (this.feed.find(item2 => item2.uri === item.uri)) {
        return // stop here - we've hit a post we already ahve
      }
      this._prepend(counter++, item)
    }
  }

  private _prepend(
    keyId: number,
    item: GetHomeFeed.FeedItem | GetAuthorFeed.FeedItem,
  ) {
    // TODO: validate .record
    this.feed.unshift(new FeedItemModel(this.rootStore, `item-${keyId}`, item))
  }

  private _updateAll(res: GetHomeFeed.Response | GetAuthorFeed.Response) {
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
    params: GetHomeFeed.QueryParams | GetAuthorFeed.QueryParams = {},
  ): Promise<GetHomeFeed.Response | GetAuthorFeed.Response> {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'home') {
      return this.rootStore.api.app.bsky.getHomeFeed(
        params as GetHomeFeed.QueryParams,
      )
    } else {
      return this.rootStore.api.app.bsky.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    }
  }
}
