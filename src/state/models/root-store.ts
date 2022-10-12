/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import AdxApi from '../../third-party/api'
import type {ServiceClient} from '../../third-party/api/src/index'
import {createContext, useContext} from 'react'
import {isObj, hasProp} from '../lib/type-guards'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {ShellModel} from './shell'
import {MeModel} from './me'

export class RootStoreModel {
  session = new SessionModel(this)
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
    if (!didOrName) {
      throw new Error('Invalid name: ""')
    }
    if (didOrName.startsWith('did:')) {
      return didOrName
    }
    const res = await this.api.com.atproto.resolveName({name: didOrName})
    return res.data.did
  }

  async fetchStateUpdate() {
    if (!this.session.isAuthed) {
      return
    }
    try {
      await this.me.fetchStateUpdate()
    } catch (e) {
      console.error('Failed to fetch latest state', e)
    }
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

  clearAll() {
    this.session.clear()
    this.nav.clear()
    this.me.clear()
  }
}

const throwawayInst = new RootStoreModel(AdxApi.service('http://localhost')) // this will be replaced by the loader
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)
