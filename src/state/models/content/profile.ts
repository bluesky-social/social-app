import {makeAutoObservable, runInAction} from 'mobx'
import {
  AtUri,
  ComAtprotoLabelDefs,
  AppBskyGraphDefs,
  AppBskyActorGetProfile as GetProfile,
  AppBskyActorProfile,
  RichText,
  moderateProfile,
  ProfileModeration,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {FollowState} from '../cache/my-follows'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {track} from 'lib/analytics/analytics'

export class ProfileViewerModel {
  muted?: boolean
  mutedByList?: AppBskyGraphDefs.ListViewBasic
  following?: string
  followedBy?: string
  blockedBy?: boolean
  blocking?: string
  blockingByList?: AppBskyGraphDefs.ListViewBasic;
  [key: string]: unknown

  constructor() {
    makeAutoObservable(this)
  }
}

export class ProfileModel {
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
  displayName?: string = ''
  description?: string = ''
  avatar?: string = ''
  banner?: string = ''
  followersCount: number = 0
  followsCount: number = 0
  postsCount: number = 0
  labels?: ComAtprotoLabelDefs.Label[] = undefined
  viewer = new ProfileViewerModel();
  [key: string]: unknown

  // added data
  descriptionRichText?: RichText = new RichText({text: ''})

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

  get moderation(): ProfileModeration {
    return moderateProfile(this, this.rootStore.preferences.moderationOpts)
  }

  // public api
  // =

  async setup() {
    const precache = await this.rootStore.profiles.cache.get(this.params.actor)
    if (precache) {
      await this._loadWithCache(precache)
    } else {
      await this._load()
    }
  }

  async refresh() {
    await this._load(true)
  }

  async toggleFollowing() {
    if (!this.rootStore.me.did) {
      throw new Error('Not logged in')
    }

    const follows = this.rootStore.me.follows
    const followUri =
      (await follows.fetchFollowState(this.did)) === FollowState.Following
        ? follows.getFollowUri(this.did)
        : undefined

    // guard against this view getting out of sync with the follows cache
    if (followUri !== this.viewer.following) {
      this.viewer.following = followUri
      return
    }

    if (followUri) {
      // unfollow
      await this.rootStore.agent.deleteFollow(followUri)
      runInAction(() => {
        this.followersCount--
        this.viewer.following = undefined
        this.rootStore.me.follows.removeFollow(this.did)
      })
      track('Profile:Unfollow', {
        username: this.handle,
      })
    } else {
      // follow
      const res = await this.rootStore.agent.follow(this.did)
      runInAction(() => {
        this.followersCount++
        this.viewer.following = res.uri
        this.rootStore.me.follows.hydrate(this.did, this)
      })
      track('Profile:Follow', {
        username: this.handle,
      })
    }
  }

  async updateProfile(
    updates: AppBskyActorProfile.Record,
    newUserAvatar: RNImage | undefined | null,
    newUserBanner: RNImage | undefined | null,
  ) {
    await this.rootStore.agent.upsertProfile(async existing => {
      existing = existing || {}
      existing.displayName = updates.displayName
      existing.description = updates.description
      if (newUserAvatar) {
        const res = await apilib.uploadBlob(
          this.rootStore,
          newUserAvatar.path,
          newUserAvatar.mime,
        )
        existing.avatar = res.data.blob
      } else if (newUserAvatar === null) {
        existing.avatar = undefined
      }
      if (newUserBanner) {
        const res = await apilib.uploadBlob(
          this.rootStore,
          newUserBanner.path,
          newUserBanner.mime,
        )
        existing.banner = res.data.blob
      } else if (newUserBanner === null) {
        existing.banner = undefined
      }
      return existing
    })
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

  async blockAccount() {
    const res = await this.rootStore.agent.app.bsky.graph.block.create(
      {
        repo: this.rootStore.me.did,
      },
      {
        subject: this.did,
        createdAt: new Date().toISOString(),
      },
    )
    this.viewer.blocking = res.uri
    await this.refresh()
  }

  async unblockAccount() {
    if (!this.viewer.blocking) {
      return
    }
    const {rkey} = new AtUri(this.viewer.blocking)
    await this.rootStore.agent.app.bsky.graph.block.delete({
      repo: this.rootStore.me.did,
      rkey,
    })
    this.viewer.blocking = undefined
    await this.refresh()
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch profile', {error: err})
    }
  }

  // loader functions
  // =

  async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.agent.getProfile(this.params)
      this.rootStore.profiles.overwrite(this.params.actor, res)
      if (res.data.handle) {
        this.rootStore.handleResolutions.cache.set(
          res.data.handle,
          res.data.did,
        )
      }
      this._replaceAll(res)
      await this._createRichText()
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  async _loadWithCache(precache: GetProfile.Response) {
    // use cached value
    this._replaceAll(precache)
    await this._createRichText()
    this._xIdle()

    // fetch latest
    try {
      const res = await this.rootStore.agent.getProfile(this.params)
      this.rootStore.profiles.overwrite(this.params.actor, res) // cache invalidation
      this._replaceAll(res)
      await this._createRichText()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  _replaceAll(res: GetProfile.Response) {
    this.did = res.data.did
    this.handle = res.data.handle
    this.displayName = res.data.displayName
    this.description = res.data.description
    this.avatar = res.data.avatar
    this.banner = res.data.banner
    this.followersCount = res.data.followersCount || 0
    this.followsCount = res.data.followsCount || 0
    this.postsCount = res.data.postsCount || 0
    this.labels = res.data.labels
    if (res.data.viewer) {
      Object.assign(this.viewer, res.data.viewer)
    }
    this.rootStore.me.follows.hydrate(this.did, res.data)
  }

  async _createRichText() {
    this.descriptionRichText = new RichText(
      {text: this.description || ''},
      {cleanNewlines: true},
    )
    await this.descriptionRichText.detectFacets(this.rootStore.agent)
  }
}
