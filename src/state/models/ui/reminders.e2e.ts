import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'

export class Reminders {
  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {serialize: false, hydrate: false},
      {autoBind: true},
    )
  }

  serialize() {
    return {}
  }

  hydrate(_v: unknown) {}

  get shouldRequestEmailConfirmation() {
    return false
  }

  setEmailConfirmationRequested() {}
}
