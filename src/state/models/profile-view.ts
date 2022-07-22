import {makeAutoObservable} from 'mobx'
import {bsky} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

export class ProfileViewModel implements bsky.ProfileView.Response {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: bsky.ProfileView.Params

  // data
  did: string = ''
  name: string = ''
  displayName: string = ''
  description: string = ''
  followersCount: number = 0
  followsCount: number = 0
  postsCount: number = 0
  badges: bsky.ProfileView.Badge[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: bsky.ProfileView.Params,
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
    return this.did !== ''
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
    await this._load()
  }

  async refresh() {
    await this._load()
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

  private async _load() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:ProfileView',
        this.params,
      )) as bsky.ProfileView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: bsky.ProfileView.Response) {
    this.did = res.did
    this.name = res.name
    this.displayName = res.displayName
    this.description = res.description
    this.followersCount = res.followersCount
    this.followsCount = res.followsCount
    this.postsCount = res.postsCount
    this.badges = res.badges
  }
}
