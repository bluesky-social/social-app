import {BskyAgent} from '@atproto/api'
import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'

export class AccountModel {
  serviceUrl = ''
  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {},
      {
        autoBind: true,
      },
    )
  }

  updatePassword() {
    const agent = new BskyAgent({service: this.serviceUrl})
  }
}
