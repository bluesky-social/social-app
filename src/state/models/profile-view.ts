import {makeAutoObservable, runInAction} from 'mobx'
import {PickedMedia} from 'lib/media/picker'
import {
  AppBskyActorGetProfile as GetProfile,
  AppBskySystemDeclRef,
  AppBskyActorUpdateProfile,
} from '@atproto/api'
type DeclRef = AppBskySystemDeclRef.Main
import {extractEntities} from 'lib/strings/rich-text-detection'
import {RootStoreModel} from './root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {RichText} from 'lib/strings/rich-text'

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
  declaration: DeclRef = {
    cid: '',
    actorType: '',
  }
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

  get isUser() {
    return this.declaration.actorType === ACTOR_TYPE_USER
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
      await apilib.unfollow(this.rootStore, followUri)
      runInAction(() => {
        this.followersCount--
        this.viewer.following = undefined
        this.rootStore.me.follows.removeFollow(this.did)
      })
    } else {
      const res = await apilib.follow(
        this.rootStore,
        this.did,
        this.declaration.cid,
      )
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
    } else {
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
    } else {
      updates.banner = null
    }
    await this.rootStore.api.app.bsky.actor.updateProfile(updates)
    await this.rootStore.me.load()
    await this.refresh()
  }

  async muteAccount() {
    await this.rootStore.api.app.bsky.graph.mute({user: this.did})
    this.viewer.muted = true
    await this.refresh()
  }

  async unmuteAccount() {
    await this.rootStore.api.app.bsky.graph.unmute({user: this.did})
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
      const res = await this.rootStore.api.app.bsky.actor.getProfile(
        this.params,
      )
      this.rootStore.profiles.overwrite(this.params.actor, res) // cache invalidation
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private _replaceAll(res: GetProfile.Response) {
    this.did = res.data.did
    this.handle = res.data.handle
    Object.assign(this.declaration, res.data.declaration)
    this.creator = res.data.creator
    this.displayName = res.data.displayName
    this.description = res.data.description
    this.avatar = res.data.avatar
    this.banner = res.data.banner
    this.followersCount = res.data.followersCount
    this.followsCount = res.data.followsCount
    this.postsCount = res.data.postsCount
    if (res.data.viewer) {
      Object.assign(this.viewer, res.data.viewer)
      this.rootStore.me.follows.hydrate(this.did, res.data.viewer.following)
    }
    this.descriptionRichText = new RichText(
      this.description || '',
      extractEntities(this.description || ''),
      {cleanNewlines: true},
    )
  }
}
