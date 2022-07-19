import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'

export class MeModel {
  did?: string
  name?: string
  displayName?: string
  description?: string

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  async load() {
    const sess = this.rootStore.session
    if (sess.isAuthed) {
      const userDb = this.rootStore.api.mockDb.mainUser
      this.did = userDb.did
      this.name = userDb.name
      const profile = await this.rootStore.api
        .repo(this.did, true)
        .collection('blueskyweb.xyz:Profiles')
        .get('Profile', 'profile')
        .catch(_ => undefined)
      runInAction(() => {
        if (profile?.valid) {
          this.displayName = profile.value.displayName
          this.description = profile.value.description
        } else {
          this.displayName = ''
          this.description = ''
        }
      })
    } else {
      this.did = undefined
      this.name = undefined
      this.displayName = undefined
      this.description = undefined
    }
  }
}
