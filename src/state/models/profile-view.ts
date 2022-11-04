import {makeAutoObservable, runInAction} from 'mobx'
import * as GetProfile from '../../third-party/api/src/client/types/app/bsky/actor/getProfile'
import * as Profile from '../../third-party/api/src/client/types/app/bsky/actor/profile'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

export class ProfileViewMyStateModel {
  follow?: string

  constructor() {
    makeAutoObservable(this)
  }
}

export class ProfileViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetProfile.QueryParams

  // data
  did: string = ''
  handle: string = ''
  displayName?: string
  description?: string
  followersCount: number = 0
  followsCount: number = 0
  postsCount: number = 0
  myState = new ProfileViewMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    params: GetProfile.QueryParams,
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
    await this._load(true)
  }

  async toggleFollowing() {
    if (!this.rootStore.me.did) {
      throw new Error('Not logged in')
    }
    if (this.myState.follow) {
      await apilib.unfollow(this.rootStore, this.myState.follow)
      runInAction(() => {
        this.followersCount--
        this.myState.follow = undefined
      })
    } else {
      const res = await apilib.follow(this.rootStore, this.did)
      runInAction(() => {
        this.followersCount++
        this.myState.follow = res.uri
      })
    }
  }

  async updateProfile(fn: (existing?: Profile.Record) => Profile.Record) {
    if (this.did !== this.rootStore.me.did) {
      throw new Error('Not your profile!')
    }
    await apilib.updateProfile(this.rootStore, fn)
    await this.refresh()
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

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.actor.getProfile(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: GetProfile.Response) {
    this.did = res.data.did
    this.handle = res.data.handle
    this.displayName = res.data.displayName
    this.description = res.data.description
    this.followersCount = res.data.followersCount
    this.followsCount = res.data.followsCount
    this.postsCount = res.data.postsCount
    if (res.data.myState) {
      Object.assign(this.myState, res.data.myState)
    }
  }
}
