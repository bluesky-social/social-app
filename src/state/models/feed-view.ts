import {makeAutoObservable, runInAction} from 'mobx'
import * as GetFeedView from '../../third-party/api/src/types/todo/social/getFeed'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

export class FeedViewItemMyStateModel {
  repost?: string
  like?: string

  constructor() {
    makeAutoObservable(this)
  }
}

export class FeedViewItemModel implements GetFeedView.FeedItem {
  // ui state
  _reactKey: string = ''

  // data
  cursor: string = ''
  uri: string = ''
  author: GetFeedView.User = {did: '', name: '', displayName: ''}
  repostedBy?: GetFeedView.User
  record: Record<string, unknown> = {}
  embed?:
    | GetFeedView.RecordEmbed
    | GetFeedView.ExternalEmbed
    | GetFeedView.UnknownEmbed
  replyCount: number = 0
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''
  myState = new FeedViewItemMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GetFeedView.FeedItem,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
  }

  copy(v: GetFeedView.FeedItem) {
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

export class FeedViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  hasReachedEnd = false
  error = ''
  params: GetFeedView.QueryParams
  _loadPromise: Promise<void> | undefined
  _loadMorePromise: Promise<void> | undefined
  _loadLatestPromise: Promise<void> | undefined
  _updatePromise: Promise<void> | undefined

  // data
  feed: FeedViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetFeedView.QueryParams,
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
      const res = await this.rootStore.api.todo.social.getFeed(this.params)
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _loadLatest() {
    this._xLoading()
    try {
      const res = await this.rootStore.api.todo.social.getFeed(this.params)
      this._prependAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _loadMore() {
    this._xLoading()
    try {
      const params = Object.assign({}, this.params, {
        before: this.loadMoreCursor,
      })
      const res = await this.rootStore.api.todo.social.getFeed(params)
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
        const res: GetFeedView.Response =
          await this.rootStore.api.todo.social.getFeed({
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

  private _replaceAll(res: GetFeedView.Response) {
    this.feed.length = 0
    this.hasReachedEnd = false
    this._appendAll(res)
  }

  private _appendAll(res: GetFeedView.Response) {
    let counter = this.feed.length
    for (const item of res.data.feed) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: GetFeedView.FeedItem) {
    // TODO: validate .record
    this.feed.push(new FeedViewItemModel(this.rootStore, `item-${keyId}`, item))
  }

  private _prependAll(res: GetFeedView.Response) {
    let counter = this.feed.length
    for (const item of res.data.feed) {
      if (this.feed.find(item2 => item2.uri === item.uri)) {
        return // stop here - we've hit a post we already ahve
      }
      this._prepend(counter++, item)
    }
  }

  private _prepend(keyId: number, item: GetFeedView.FeedItem) {
    // TODO: validate .record
    this.feed.unshift(
      new FeedViewItemModel(this.rootStore, `item-${keyId}`, item),
    )
  }

  private _updateAll(res: GetFeedView.Response) {
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
}
