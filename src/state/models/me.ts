import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {MembershipsViewModel} from './memberships-view'
import {NotificationsViewModel} from './notifications-view'

export class MeModel {
  did?: string
  handle?: string
  displayName?: string
  description?: string
  notificationCount: number = 0
  memberships?: MembershipsViewModel
  notifications: NotificationsViewModel

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
    this.notifications = new NotificationsViewModel(this.rootStore, {})
  }

  clear() {
    this.did = undefined
    this.handle = undefined
    this.displayName = undefined
    this.description = undefined
    this.notificationCount = 0
    this.memberships = undefined
  }

  async load() {
    const sess = this.rootStore.session
    if (sess.isAuthed && sess.data) {
      this.did = sess.data.did || ''
      this.handle = sess.data.handle
      const profile = await this.rootStore.api.app.bsky.actor.getProfile({
        actor: this.did,
      })
      runInAction(() => {
        if (profile?.data) {
          this.displayName = profile.data.displayName
          this.description = profile.data.description
        } else {
          this.displayName = ''
          this.description = ''
        }
      })
      this.memberships = new MembershipsViewModel(this.rootStore, {
        actor: this.did,
      })
      await this.memberships?.setup().catch(e => {
        console.error('Failed to setup memberships model', e)
      })
      await this.notifications.setup().catch(e => {
        console.error('Failed to setup notifications model', e)
      })
    } else {
      this.clear()
    }
  }

  clearNotificationCount() {
    this.notificationCount = 0
  }

  async fetchStateUpdate() {
    const res = await this.rootStore.api.app.bsky.notification.getCount()
    runInAction(() => {
      const newNotifications = this.notificationCount !== res.data.count
      this.notificationCount = res.data.count
      if (newNotifications) {
        // trigger pre-emptive fetch on new notifications
        this.notifications.refresh()
      }
    })
  }

  async refreshMemberships() {
    return this.memberships?.refresh()
  }
}
