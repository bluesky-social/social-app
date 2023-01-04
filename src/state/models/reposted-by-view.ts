import {makeAutoObservable, runInAction} from 'mobx'
import {AtUri} from '../../third-party/uri'
import {
  AppBskyFeedGetRepostedBy as GetRepostedBy,
  AppBskySystemDeclRef,
} from '@atproto/api'
type DeclRef = AppBskySystemDeclRef.Main
import {RootStoreModel} from './root-store'

export class RepostedByViewItemModel implements GetRepostedBy.RepostedBy {
  // ui state
  _reactKey: string = ''

  // data
  did: string = ''
  handle: string = ''
  displayName: string = ''
  avatar?: string
  declaration: DeclRef = {cid: '', actorType: ''}
  createdAt?: string
  indexedAt: string = ''

  constructor(reactKey: string, v: RepostedByItem) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    Object.assign(this, v)
  }
}

export class RepostedByViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: GetRepostedBy.QueryParams

  // data
  uri: string = ''
  repostedBy: RepostedByViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetRepostedBy.QueryParams,
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

  private _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err ? err.toString() : ''
    if (err) {
      this.rootStore.log.error('Failed to fetch reposted by view', err)
    }
  }

  // loader functions
  // =

  private async _resolveUri() {
    const urip = new AtUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      try {
        urip.host = await this.rootStore.resolveName(urip.host)
      } catch (e: any) {
        this.error = e.toString()
      }
    }
    runInAction(() => {
      this.resolvedUri = urip.toString()
    })
  }

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.feed.getRepostedBy(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private async _refresh() {
    this._xLoading(true)
    // TODO: refetch and update items
    this._xIdle()
  }

  private _replaceAll(res: GetRepostedBy.Response) {
    this.repostedBy.length = 0
    let counter = 0
    for (const item of res.data.repostedBy) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: RepostedByItem) {
    this.repostedBy.push(new RepostedByViewItemModel(`item-${keyId}`, item))
  }
}
