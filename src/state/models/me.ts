import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'

export class MeModel {
  did?: string
  name?: string
  displayName?: string
  description?: string
  notificationCount: number = 0

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  clear() {
    this.did = undefined
    this.name = undefined
    this.displayName = undefined
    this.description = undefined
    this.notificationCount = 0
  }

  async load() {
    const sess = this.rootStore.session
    if (sess.isAuthed && sess.data) {
      this.did = sess.data.userdid || ''
      this.name = sess.data.username
      const profile = await this.rootStore.api.todo.social.getProfile({
        user: this.did,
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
    } else {
      this.clear()
    }
  }

  async fetchStateUpdate() {
    const res = await this.rootStore.api.todo.social.getNotificationCount({})
    runInAction(() => {
      this.notificationCount = res.data.count
    })
  }
}
