import {makeAutoObservable, runInAction} from 'mobx'
import {AdxUri} from '../../third-party/uri'
import * as GetLikedBy from '../../third-party/api/src/types/todo/social/getLikedBy'
import {RootStoreModel} from './root-store'

type LikedByItem = GetLikedBy.OutputSchema['likedBy'][number]

export class LikedByViewItemModel implements LikedByItem {
  // ui state
  _reactKey: string = ''

  // data
  did: string = ''
  name: string = ''
  displayName: string = ''
  createdAt?: string
  indexedAt: string = ''

  constructor(reactKey: string, v: LikedByItem) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    Object.assign(this, v)
  }
}

export class LikedByViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: GetLikedBy.QueryParams

  // data
  uri: string = ''
  likedBy: LikedByViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetLikedBy.QueryParams,
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
  }

  get hasContent() {
    return this.uri !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    if (!this.resolvedUri) {
      await this._resolveUri()
    }
    await this._fetch()
  }

  async refresh() {
    await this._fetch(true)
  }

  async loadMore() {
    // TODO
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

  private async _resolveUri() {
    const urip = new AdxUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      urip.host = await this.rootStore.resolveName(urip.host)
    }
    runInAction(() => {
      this.resolvedUri = urip.toString()
    })
  }

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.todo.social.getLikedBy(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetLikedBy.Response) {
    this.likedBy.length = 0
    let counter = 0
    for (const item of res.data.likedBy) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: LikedByItem) {
    this.likedBy.push(new LikedByViewItemModel(`item-${keyId}`, item))
  }
}
