import {makeAutoObservable} from 'mobx'
import * as GetUserFollowers from '../../third-party/api/src/types/todo/social/getUserFollowers'
import {RootStoreModel} from './root-store'

type Subject = GetUserFollowers.OutputSchema['subject']
export type FollowerItem =
  GetUserFollowers.OutputSchema['followers'][number] & {_reactKey: string}

export class UserFollowersViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetUserFollowers.QueryParams

  // data
  subject: Subject = {did: '', name: '', displayName: ''}
  followers: FollowerItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetUserFollowers.QueryParams,
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
      const res = await this.rootStore.api.todo.social.getUserFollowers(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetUserFollowers.Response) {
    this.subject.did = res.data.subject.did
    this.subject.name = res.data.subject.name
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
