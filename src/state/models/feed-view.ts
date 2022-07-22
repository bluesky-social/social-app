import {makeAutoObservable} from 'mobx'
import {bsky} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

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

  constructor(reactKey: string, v: bsky.FeedView.FeedItem) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    Object.assign(this, v)
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
    this.feed.push(new FeedViewItemModel(`item-${keyId}`, item))
  }
}
