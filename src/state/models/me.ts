import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {MembershipsViewModel} from './memberships-view'

export class MeModel {
  did?: string
  handle?: string
  displayName?: string
  description?: string
  notificationCount: number = 0
  memberships?: MembershipsViewModel

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
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
      await this.memberships?.setup()
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
      this.notificationCount = res.data.count
    })
  }

  async refreshMemberships() {
    return this.memberships?.refresh()
  }
}
