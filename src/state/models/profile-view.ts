import {makeAutoObservable, runInAction} from 'mobx'
import {PickedMedia} from 'lib/media/picker'
import {
  AppBskyActorGetProfile as GetProfile,
  AppBskyActorUpdateProfile,
  RichText,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'

export const ACTOR_TYPE_USER = 'app.bsky.system.actorUser'

export class ProfileViewViewerModel {
  muted?: boolean
  following?: string
  followedBy?: string

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
  creator: string = ''
  displayName?: string
  description?: string
  avatar?: string
  banner?: string
  followersCount: number = 0
  followsCount: number = 0
  postsCount: number = 0
  viewer = new ProfileViewViewerModel()

  // added data
  descriptionRichText?: RichText

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

    const follows = this.rootStore.me.follows
    const followUri = follows.isFollowing(this.did)
      ? follows.getFollowUri(this.did)
      : undefined

    // guard against this view getting out of sync with the follows cache
    if (followUri !== this.viewer.following) {
      this.viewer.following = followUri
      return
    }

    if (followUri) {
      await this.rootStore.agent.deleteFollow(followUri)
      runInAction(() => {
        this.followersCount--
        this.viewer.following = undefined
        this.rootStore.me.follows.removeFollow(this.did)
      })
    } else {
      const res = await this.rootStore.agent.follow(this.did)
      runInAction(() => {
        this.followersCount++
        this.viewer.following = res.uri
        this.rootStore.me.follows.addFollow(this.did, res.uri)
      })
    }
  }

  async updateProfile(
    updates: AppBskyActorUpdateProfile.InputSchema,
    newUserAvatar: PickedMedia | undefined | null,
    newUserBanner: PickedMedia | undefined | null,
  ) {
    if (newUserAvatar) {
      const res = await apilib.uploadBlob(
        this.rootStore,
        newUserAvatar.path,
        newUserAvatar.mime,
      )
      updates.avatar = {
        cid: res.data.cid,
        mimeType: newUserAvatar.mime,
      }
    } else if (newUserAvatar === null) {
      updates.avatar = null
    }
    if (newUserBanner) {
      const res = await apilib.uploadBlob(
        this.rootStore,
        newUserBanner.path,
        newUserBanner.mime,
      )
      updates.banner = {
        cid: res.data.cid,
        mimeType: newUserBanner.mime,
      }
    } else if (newUserBanner === null) {
      updates.banner = null
    }
    await this.rootStore.api.app.bsky.actor.updateProfile(updates)
    await this.rootStore.me.load()
    await this.refresh()
  }

  async muteAccount() {
    await this.rootStore.agent.mute(this.did)
    this.viewer.muted = true
    await this.refresh()
  }

  async unmuteAccount() {
    await this.rootStore.agent.unmute(this.did)
    this.viewer.muted = false
    await this.refresh()
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
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch profile', err)
    }
  }

  // loader functions
  // =

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.agent.getProfile(this.params)
      this.rootStore.profiles.overwrite(this.params.actor, res) // cache invalidation
      this._replaceAll(res)
      await this._createRichText()
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private _replaceAll(res: GetProfile.Response) {
    this.did = res.data.did
    this.handle = res.data.handle
    this.creator = res.data.creator
    this.displayName = res.data.displayName
    this.description = res.data.description
    this.avatar = res.data.avatar
    this.banner = res.data.banner
    this.followersCount = res.data.followersCount || 0
    this.followsCount = res.data.followsCount || 0
    this.postsCount = res.data.postsCount || 0
    if (res.data.viewer) {
      Object.assign(this.viewer, res.data.viewer)
      this.rootStore.me.follows.hydrate(this.did, res.data.viewer.following)
    }
  }

  private async _createRichText() {
    this.descriptionRichText = new RichText(
      {text: this.description || ''},
      {cleanNewlines: true},
    )
    await this.descriptionRichText.detectFacets(this.rootStore.agent)
  }
}
