import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {FeedModel} from './feed-view'
import {NotificationsViewModel} from './notifications-view'
import {MyFollowsModel} from './my-follows'
import {isObj, hasProp} from 'lib/type-guards'

export class MeModel {
  did: string = ''
  handle: string = ''
  displayName: string = ''
  description: string = ''
  avatar: string = ''
  mainFeed: FeedModel
  notifications: NotificationsViewModel
  follows: MyFollowsModel

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {rootStore: false, serialize: false, hydrate: false},
      {autoBind: true},
    )
    this.mainFeed = new FeedModel(this.rootStore, 'home', {
      algorithm: 'reverse-chronological',
    })
    this.notifications = new NotificationsViewModel(this.rootStore, {})
    this.follows = new MyFollowsModel(this.rootStore)
  }

  clear() {
    this.mainFeed.clear()
    this.notifications.clear()
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
    this.rootStore.log.debug('MeModel:load', {hasSession: sess.hasSession})
    if (sess.hasSession) {
      this.did = sess.currentSession?.did || ''
      this.handle = sess.currentSession?.handle || ''
      const profile = await this.rootStore.api.app.bsky.actor.getProfile({
        actor: this.did,
      })
      runInAction(() => {
        if (profile?.data) {
          this.displayName = profile.data.displayName || ''
          this.description = profile.data.description || ''
          this.avatar = profile.data.avatar || ''
        } else {
          this.displayName = ''
          this.description = ''
          this.avatar = ''
        }
      })
      this.mainFeed.clear()
      await Promise.all([
        this.mainFeed.setup().catch(e => {
          this.rootStore.log.error('Failed to setup main feed model', e)
        }),
        this.notifications.setup().catch(e => {
          this.rootStore.log.error('Failed to setup notifications model', e)
        }),
        this.follows.fetch().catch(e => {
          this.rootStore.log.error('Failed to load my follows', e)
        }),
      ])
      this.rootStore.emitSessionLoaded()
    } else {
      this.clear()
    }
  }
}
