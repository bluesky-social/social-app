/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import {sessionClient as AtpApi} from '../../third-party/api'
import type {SessionServiceClient} from '../../third-party/api/src/index'
import {createContext, useContext} from 'react'
import {isObj, hasProp} from '../lib/type-guards'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {ShellUiModel} from './shell-ui'
import {ProfilesViewModel} from './profiles-view'
import {MeModel} from './me'
import {OnboardModel} from './onboard'

export class RootStoreModel {
  session = new SessionModel(this)
  nav = new NavigationModel()
  shell = new ShellUiModel()
  me = new MeModel(this)
  onboard = new OnboardModel()
  profiles = new ProfilesViewModel(this)

  constructor(public api: SessionServiceClient) {
    makeAutoObservable(this, {
      api: false,
      resolveName: false,
      serialize: false,
      hydrate: false,
    })
  }

  async resolveName(didOrHandle: string) {
    if (!didOrHandle) {
      throw new Error('Invalid handle: ""')
    }
    if (didOrHandle.startsWith('did:')) {
      return didOrHandle
    }
    const res = await this.api.com.atproto.handle.resolve({handle: didOrHandle})
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
      onboard: this.onboard.serialize(),
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
      if (hasProp(v, 'onboard')) {
        this.onboard.hydrate(v.onboard)
      }
    }
  }

  clearAll() {
    this.session.clear()
    this.nav.clear()
    this.me.clear()
  }
}

const throwawayInst = new RootStoreModel(AtpApi.service('http://localhost')) // this will be replaced by the loader, we just need to supply a value at init
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)
