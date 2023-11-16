import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {isObj, hasProp} from 'lib/type-guards'
import {logger} from '#/logger'

const PROFILE_UPDATE_INTERVAL = 10 * 60 * 1e3 // 10min

export class MeModel {
  did: string = ''
  handle: string = ''
  displayName: string = ''
  description: string = ''
  avatar: string = ''
  followsCount: number | undefined
  followersCount: number | undefined
  lastProfileStateUpdate = Date.now()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {rootStore: false, serialize: false, hydrate: false},
      {autoBind: true},
    )
  }

  clear() {
    this.rootStore.profiles.cache.clear()
    this.rootStore.posts.cache.clear()
    this.did = ''
    this.handle = ''
    this.displayName = ''
    this.description = ''
    this.avatar = ''
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
      this.rootStore.emitSessionLoaded()
    } else {
      this.clear()
    }
  }

  async updateIfNeeded() {
    if (Date.now() - this.lastProfileStateUpdate > PROFILE_UPDATE_INTERVAL) {
      logger.debug('Updating me profile information')
      this.lastProfileStateUpdate = Date.now()
      await this.fetchProfile()
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
}
