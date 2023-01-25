import {makeAutoObservable, runInAction} from 'mobx'
import notifee from '@notifee/react-native'
import {RootStoreModel} from './root-store'
import {FeedModel} from './feed-view'
import {NotificationsViewModel} from './notifications-view'
import {isObj, hasProp} from '../lib/type-guards'
import {displayNotificationFromModel} from '../../view/lib/notifee'

export class MeModel {
  did: string = ''
  handle: string = ''
  displayName: string = ''
  description: string = ''
  avatar: string = ''
  notificationCount: number = 0
  mainFeed: FeedModel
  notifications: NotificationsViewModel

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
  }

  clear() {
    this.did = ''
    this.handle = ''
    this.displayName = ''
    this.description = ''
    this.avatar = ''
    this.notificationCount = 0
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
    if (sess.hasSession && sess.data) {
      this.did = sess.data.did || ''
      this.handle = sess.data.handle
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
      this.mainFeed = new FeedModel(this.rootStore, 'home', {
        algorithm: 'reverse-chronological',
      })
      this.notifications = new NotificationsViewModel(this.rootStore, {})
      await Promise.all([
        this.mainFeed.setup().catch(e => {
          this.rootStore.log.error('Failed to setup main feed model', e)
        }),
        this.notifications.setup().catch(e => {
          this.rootStore.log.error('Failed to setup notifications model', e)
        }),
      ])

      // request notifications permission once the user has logged in
      notifee.requestPermission()
    } else {
      this.clear()
    }
  }

  clearNotificationCount() {
    this.notificationCount = 0
    notifee.setBadgeCount(0)
  }

  async fetchNotifications() {
    const res = await this.rootStore.api.app.bsky.notification.getCount()
    runInAction(() => {
      const newNotifications = this.notificationCount !== res.data.count
      this.notificationCount = res.data.count
      notifee.setBadgeCount(this.notificationCount)
      if (newNotifications) {
        this.notifications.refresh()
      }
    })
  }

  async bgFetchNotifications() {
    const res = await this.rootStore.api.app.bsky.notification.getCount()
    // NOTE we don't update this.notificationCount to avoid repaints during bg
    //      this means `newNotifications` may not be accurate, so we rely on
    //      `mostRecent` to determine if there really is a new notif to show -prf
    const newNotifications = this.notificationCount !== res.data.count
    notifee.setBadgeCount(res.data.count)
    this.rootStore.log.debug(
      `Background fetch received unread count = ${res.data.count}`,
    )
    if (newNotifications) {
      this.rootStore.log.debug(
        'Background fetch detected potentially a new notification',
      )
      const mostRecent = await this.notifications.getNewMostRecent()
      if (mostRecent) {
        this.rootStore.log.debug('Got the notification, triggering a push')
        displayNotificationFromModel(mostRecent)
      }
    }
  }
}
