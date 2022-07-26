import {makeAutoObservable} from 'mobx'
import {bsky} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

type Subject = bsky.UserFollowsView.Response['subject']
export type FollowItem = bsky.UserFollowsView.Response['follows'][number] & {
  _reactKey: string
}

export class UserFollowsViewModel implements bsky.UserFollowsView.Response {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: bsky.UserFollowsView.Params

  // data
  subject: Subject = {did: '', name: '', displayName: ''}
  follows: FollowItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: bsky.UserFollowsView.Params,
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
    return this.subject.did !== ''
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

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:UserFollowsView',
        this.params,
      )) as bsky.UserFollowsView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: bsky.UserFollowsView.Response) {
    this.subject.did = res.subject.did
    this.subject.name = res.subject.name
    this.subject.displayName = res.subject.displayName
    this.follows.length = 0
    let counter = 0
    for (const item of res.follows) {
      this._append({_reactKey: `item-${counter++}`, ...item})
    }
  }

  private _append(item: FollowItem) {
    this.follows.push(item)
  }
}
