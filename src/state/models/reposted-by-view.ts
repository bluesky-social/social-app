import {makeAutoObservable, runInAction} from 'mobx'
import {bsky, AdxUri} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

type RepostedByItem = bsky.RepostedByView.Response['repostedBy'][number]

export class RepostedByViewItemModel implements RepostedByItem {
  // ui state
  _reactKey: string = ''

  // data
  did: string = ''
  name: string = ''
  displayName: string = ''
  createdAt?: string
  indexedAt: string = ''

  constructor(reactKey: string, v: RepostedByItem) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    Object.assign(this, v)
  }
}

export class RepostedByViewModel implements bsky.RepostedByView.Response {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: bsky.RepostedByView.Params

  // data
  uri: string = ''
  repostedBy: RepostedByViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: bsky.RepostedByView.Params,
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
    await this._refresh()
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

  private async _fetch() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:RepostedByView',
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )) as bsky.RepostedByView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private async _refresh() {
    this._xLoading(true)
    // TODO: refetch and update items
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    this._xIdle()
  }

  private _replaceAll(res: bsky.RepostedByView.Response) {
    this.repostedBy.length = 0
    let counter = 0
    for (const item of res.repostedBy) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: RepostedByItem) {
    this.repostedBy.push(new RepostedByViewItemModel(`item-${keyId}`, item))
  }
}
