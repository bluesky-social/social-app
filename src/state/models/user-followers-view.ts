import {makeAutoObservable} from 'mobx'
import * as GetFollowers from '../../third-party/api/src/client/types/app/bsky/graph/getFollowers'
import {RootStoreModel} from './root-store'

type Subject = GetFollowers.OutputSchema['subject']
export type FollowerItem = GetFollowers.OutputSchema['followers'][number] & {
  _reactKey: string
}

export class UserFollowersViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetFollowers.QueryParams

  // data
  subject: Subject = {
    did: '',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
  }
  followers: FollowerItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetFollowers.QueryParams,
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
    try {
      const res = await this.rootStore.api.app.bsky.graph.getFollowers(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetFollowers.Response) {
    this.subject.did = res.data.subject.did
    this.subject.handle = res.data.subject.handle
    this.subject.displayName = res.data.subject.displayName
    this.followers.length = 0
    let counter = 0
    for (const item of res.data.followers) {
      this._append({_reactKey: `item-${counter++}`, ...item})
    }
  }

  private _append(item: FollowerItem) {
    this.followers.push(item)
  }
}
