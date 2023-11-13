import {makeAutoObservable, runInAction} from 'mobx'
import {
  ComAtprotoServerDefs,
  ComAtprotoServerListAppPasswords,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {NotificationsFeedModel} from './feeds/notifications'
import {MyFollowsCache} from './cache/my-follows'
import {isObj, hasProp} from 'lib/type-guards'
import {logger} from '#/logger'

const PROFILE_UPDATE_INTERVAL = 10 * 60 * 1e3 // 10min
const NOTIFS_UPDATE_INTERVAL = 30 * 1e3 // 30sec

export class MeModel {
  did: string = ''
  handle: string = ''
  displayName: string = ''
  description: string = ''
  avatar: string = ''
  followsCount: number | undefined
  followersCount: number | undefined
  notifications: NotificationsFeedModel
  follows: MyFollowsCache
  invites: ComAtprotoServerDefs.InviteCode[] = []
  appPasswords: ComAtprotoServerListAppPasswords.AppPassword[] = []
  lastProfileStateUpdate = Date.now()
  lastNotifsUpdate = Date.now()

  get invitesAvailable() {
    return this.invites.filter(isInviteAvailable).length
  }

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {rootStore: false, serialize: false, hydrate: false},
      {autoBind: true},
    )
    this.notifications = new NotificationsFeedModel(this.rootStore)
    this.follows = new MyFollowsCache(this.rootStore)
  }

  clear() {
    this.notifications.clear()
    this.follows.clear()
    this.rootStore.profiles.cache.clear()
    this.rootStore.posts.cache.clear()
    this.did = ''
    this.handle = ''
    this.displayName = ''
    this.description = ''
    this.avatar = ''
    this.invites = []
    this.appPasswords = []
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
    logger.debug('MeModel:load', {hasSession: sess.hasSession})
    if (sess.hasSession) {
      this.did = sess.currentSession?.did || ''
      await this.fetchProfile()
      /* dont await */ this.notifications.setup().catch(e => {
        logger.error('Failed to setup notifications model', {
          error: e,
        })
      })
      /* dont await */ this.notifications.setup().catch(e => {
        logger.error('Failed to setup notifications model', {
          error: e,
        })
      })
      this.rootStore.emitSessionLoaded()
      await this.fetchInviteCodes()
      await this.fetchAppPasswords()
    } else {
      this.clear()
    }
  }

  async updateIfNeeded() {
    if (Date.now() - this.lastProfileStateUpdate > PROFILE_UPDATE_INTERVAL) {
      logger.debug('Updating me profile information')
      this.lastProfileStateUpdate = Date.now()
      await this.fetchProfile()
      await this.fetchInviteCodes()
      await this.fetchAppPasswords()
    }
    if (Date.now() - this.lastNotifsUpdate > NOTIFS_UPDATE_INTERVAL) {
      this.lastNotifsUpdate = Date.now()
      await this.notifications.syncQueue()
    }
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
        this.handle = profile.data.handle || ''
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
        logger.error('Failed to fetch user invite codes', {
          error: e,
        })
      }
    }
  }

  async fetchAppPasswords() {
    if (this.rootStore.session) {
      try {
        const res =
          await this.rootStore.agent.com.atproto.server.listAppPasswords({})
        runInAction(() => {
          this.appPasswords = res.data.passwords
        })
      } catch (e) {
        logger.error('Failed to fetch user app passwords', {
          error: e,
        })
      }
    }
  }

  async createAppPassword(name: string) {
    if (this.rootStore.session) {
      try {
        if (this.appPasswords.find(p => p.name === name)) {
          // TODO: this should be handled by the backend but it's not
          throw new Error('App password with this name already exists')
        }
        const res =
          await this.rootStore.agent.com.atproto.server.createAppPassword({
            name,
          })
        runInAction(() => {
          this.appPasswords.push(res.data)
        })
        return res.data
      } catch (e) {
        logger.error('Failed to create app password', {error: e})
      }
    }
  }

  async deleteAppPassword(name: string) {
    if (this.rootStore.session) {
      try {
        await this.rootStore.agent.com.atproto.server.revokeAppPassword({
          name: name,
        })
        runInAction(() => {
          this.appPasswords = this.appPasswords.filter(p => p.name !== name)
        })
      } catch (e) {
        logger.error('Failed to delete app password', {error: e})
      }
    }
  }
}

function isInviteAvailable(invite: ComAtprotoServerDefs.InviteCode): boolean {
  return invite.available - invite.uses.length > 0 && !invite.disabled
}
