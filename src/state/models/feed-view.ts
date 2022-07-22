import {makeAutoObservable, runInAction} from 'mobx'
import {bsky} from '@adxp/mock-api'
import _omit from 'lodash.omit'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

export class FeedViewItemMyStateModel {
  hasLiked: boolean = false
  hasReposted: boolean = false

  constructor() {
    makeAutoObservable(this)
  }
}

export class FeedViewItemModel implements bsky.FeedView.FeedItem {
  // ui state
  _reactKey: string = ''

  // data
  uri: string = ''
  author: bsky.FeedView.User = {did: '', name: '', displayName: ''}
  repostedBy?: bsky.FeedView.User
  record: Record<string, unknown> = {}
  embed?:
    | bsky.FeedView.RecordEmbed
    | bsky.FeedView.ExternalEmbed
    | bsky.FeedView.UnknownEmbed
  replyCount: number = 0
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''
  myState = new FeedViewItemMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: bsky.FeedView.FeedItem,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    Object.assign(this, _omit(v, 'myState'))
    if (v.myState) {
      Object.assign(this.myState, v.myState)
    }
  }

  async toggleLike() {
    if (this.myState.hasLiked) {
      await apilib.unlike(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.likeCount--
        this.myState.hasLiked = false
      })
    } else {
      await apilib.like(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.likeCount++
        this.myState.hasLiked = true
      })
    }
  }

  async toggleRepost() {
    if (this.myState.hasReposted) {
      await apilib.unrepost(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.repostCount--
        this.myState.hasReposted = false
      })
    } else {
      await apilib.repost(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.repostCount++
        this.myState.hasReposted = true
      })
    }
  }
}

export class FeedViewModel implements bsky.FeedView.Response {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: bsky.FeedView.Params
  _loadMorePromise: Promise<void> | undefined

  // data
  feed: FeedViewItemModel[] = []

  constructor(public rootStore: RootStoreModel, params: bsky.FeedView.Params) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
        _loadMorePromise: false,
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
      return this.feed[this.feed.length - 1].indexedAt
    }
    return undefined
  }

  // public api
  // =

  async setup() {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    if (this.hasContent) {
      await this._refresh()
    } else {
      await this._initialLoad()
    }
  }

  async refresh() {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    await this._refresh()
  }

  async loadMore() {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    this._loadMorePromise = this._loadMore()
    await this._loadMorePromise
    this._loadMorePromise = undefined
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

  private async _initialLoad() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 1e3)) // DEBUG
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:FeedView',
        this.params,
      )) as bsky.FeedView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _loadMore() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 1e3)) // DEBUG
    try {
      const params = Object.assign({}, this.params, {
        before: this.loadMoreCursor,
      })
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:FeedView',
        params,
      )) as bsky.FeedView.Response
      this._appendAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _refresh() {
    this._xLoading(true)
    // TODO: refetch and update items
    await new Promise(r => setTimeout(r, 1e3)) // DEBUG
    this._xIdle()
  }

  private _replaceAll(res: bsky.FeedView.Response) {
    this.feed.length = 0
    let counter = 0
    for (const item of res.feed) {
      this._append(counter++, item)
    }
  }

  private _appendAll(res: bsky.FeedView.Response) {
    let counter = this.feed.length
    for (const item of res.feed) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: bsky.FeedView.FeedItem) {
    // TODO: validate .record
    this.feed.push(new FeedViewItemModel(this.rootStore, `item-${keyId}`, item))
  }
}
