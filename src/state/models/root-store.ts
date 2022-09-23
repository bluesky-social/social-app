/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import AdxApi, {ServiceClient} from '../../third-party/api'
import {createContext, useContext} from 'react'
import {isObj, hasProp} from '../lib/type-guards'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {ShellModel} from './shell'
import {MeModel} from './me'

export class RootStoreModel {
  session = new SessionModel()
  nav = new NavigationModel()
  shell = new ShellModel()
  me = new MeModel(this)

  constructor(public api: ServiceClient) {
    makeAutoObservable(this, {
      api: false,
      resolveName: false,
      serialize: false,
      hydrate: false,
    })
  }

  async resolveName(didOrName: string) {
    throw new Error('TODO')
    return ''
    // const userDb = this.api.mockDb.getUser(didOrName)
    // if (!userDb) throw new Error(`User not found: ${didOrName}`)
    // return userDb.did
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

const throwawayInst = new RootStoreModel(AdxApi.service('http://localhost')) // this will be replaced by the loader
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)
