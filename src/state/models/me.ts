import {makeAutoObservable, runInAction} from 'mobx'
import {ComAtprotoServerDefs} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {PostsFeedModel} from './feeds/posts'
import {NotificationsFeedModel} from './feeds/notifications'
import {MyFollowsCache} from './cache/my-follows'
import {isObj, hasProp} from 'lib/type-guards'

const PROFILE_UPDATE_INTERVAL = 10 * 60 * 1e3 // 10min

export class MeModel {
  did: string = ''
  handle: string = ''
  displayName: string = ''
  description: string = ''
  avatar: string = ''
  followsCount: number | undefined
  followersCount: number | undefined
  mainFeed: PostsFeedModel
  notifications: NotificationsFeedModel
  follows: MyFollowsCache
  invites: ComAtprotoServerDefs.InviteCode[] = []
  lastProfileStateUpdate = Date.now()

  get invitesAvailable() {
    return this.invites.filter(isInviteAvailable).length
  }

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {rootStore: false, serialize: false, hydrate: false},
      {autoBind: true},
    )
    this.mainFeed = new PostsFeedModel(this.rootStore, 'home', {
      algorithm: 'reverse-chronological',
    })
    this.notifications = new NotificationsFeedModel(this.rootStore, {})
    this.follows = new MyFollowsCache(this.rootStore)
  }

  clear() {
    this.mainFeed.clear()
    this.notifications.clear()
    this.follows.clear()
    this.did = ''
    this.handle = ''
    this.displayName = ''
    this.description = ''
    this.avatar = ''
    this.invites = []
  }

  serialize(): unknown {
    return {
      did: this.did,
      handle: this.handle,
      displayName: this.displayName,
      description: this.description,
      avatar: this.avatar,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      let did, handle, displayName, description, avatar
      if (hasProp(v, 'did') && typeof v.did === 'string') {
        did = v.did
      }
      if (hasProp(v, 'handle') && typeof v.handle === 'string') {
        handle = v.handle
      }
      if (hasProp(v, 'displayName') && typeof v.displayName === 'string') {
        displayName = v.displayName
      }
      if (hasProp(v, 'description') && typeof v.description === 'string') {
        description = v.description
      }
      if (hasProp(v, 'avatar') && typeof v.avatar === 'string') {
        avatar = v.avatar
      }
      if (did && handle) {
        this.did = did
        this.handle = handle
        this.displayName = displayName || ''
        this.description = description || ''
        this.avatar = avatar || ''
      }
    }
  }

  async load() {
    const sess = this.rootStore.session
    this.rootStore.log.debug('MeModel:load', {hasSession: sess.hasSession})
    if (sess.hasSession) {
      this.did = sess.currentSession?.did || ''
      this.handle = sess.currentSession?.handle || ''
      await this.fetchProfile()
      this.mainFeed.clear()
      await Promise.all([
        this.mainFeed.setup().catch(e => {
          this.rootStore.log.error('Failed to setup main feed model', e)
        }),
        this.notifications.setup().catch(e => {
          this.rootStore.log.error('Failed to setup notifications model', e)
        }),
      ])
      this.rootStore.emitSessionLoaded()
      await this.fetchInviteCodes()
    } else {
      this.clear()
    }
  }

  async updateIfNeeded() {
    if (Date.now() - this.lastProfileStateUpdate > PROFILE_UPDATE_INTERVAL) {
      this.rootStore.log.debug('Updating me profile information')
      this.lastProfileStateUpdate = Date.now()
      await this.fetchProfile()
      await this.fetchInviteCodes()
    }
    await this.notifications.syncQueue()
  }

  async fetchProfile() {
    const profile = await this.rootStore.agent.getProfile({
      actor: this.did,
    })
    runInAction(() => {
      if (profile?.data) {
        this.displayName = profile.data.displayName || ''
        this.description = profile.data.description || ''
        this.avatar = profile.data.avatar || ''
        this.followsCount = profile.data.followsCount
        this.followersCount = profile.data.followersCount
      } else {
        this.displayName = ''
        this.description = ''
        this.avatar = ''
        this.followsCount = profile.data.followsCount
        this.followersCount = undefined
      }
    })
  }

  async fetchInviteCodes() {
    if (this.rootStore.session) {
      try {
        const res =
          await this.rootStore.agent.com.atproto.server.getAccountInviteCodes(
            {},
          )
        runInAction(() => {
          this.invites = res.data.codes
          this.invites.sort((a, b) => {
            if (!isInviteAvailable(a)) {
              return 1
            }
            if (!isInviteAvailable(b)) {
              return -1
            }
            return 0
          })
        })
      } catch (e) {
        this.rootStore.log.error('Failed to fetch user invite codes', e)
      }
      await this.rootStore.invitedUsers.fetch(this.invites)
    }
  }
}

function isInviteAvailable(invite: ComAtprotoServerDefs.InviteCode): boolean {
  return invite.available - invite.uses.length > 0 && !invite.disabled
}
