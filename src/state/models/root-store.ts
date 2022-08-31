/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import {adx, AdxClient} from '@adxp/mock-api'
import {createContext, useContext} from 'react'
import {isObj, hasProp} from '../lib/type-guards'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {MeModel} from './me'
import {FeedViewModel} from './feed-view'
import {NotificationsViewModel} from './notifications-view'

export class RootStoreModel {
  session = new SessionModel()
  nav = new NavigationModel()
  me = new MeModel(this)
  homeFeed = new FeedViewModel(this, {})
  notesFeed = new NotificationsViewModel(this, {})

  constructor(public api: AdxClient) {
    makeAutoObservable(this, {
      api: false,
      resolveName: false,
      serialize: false,
      hydrate: false,
    })
  }

  async resolveName(didOrName: string) {
    const userDb = this.api.mockDb.getUser(didOrName)
    if (!userDb) throw new Error(`User not found: ${didOrName}`)
    return userDb.did
  }

  serialize(): unknown {
    return {
      session: this.session.serialize(),
      nav: this.nav.serialize(),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'session')) {
        this.session.hydrate(v.session)
      }
      if (hasProp(v, 'nav')) {
        this.nav.hydrate(v.nav)
      }
    }
  }
}

const throwawayInst = new RootStoreModel(adx) // this will be replaced by the loader
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)
