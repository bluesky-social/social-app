/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import {sessionClient as AtpApi, SessionServiceClient} from '@atproto/api'
import {createContext, useContext} from 'react'
import {isObj, hasProp} from '../lib/type-guards'
import {LogModel} from './log'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {ShellUiModel} from './shell-ui'
import {ProfilesViewModel} from './profiles-view'
import {LinkMetasViewModel} from './link-metas-view'
import {MeModel} from './me'
import {OnboardModel} from './onboard'
import {isNetworkError} from '../../lib/errors'

export class RootStoreModel {
  log = new LogModel()
  session = new SessionModel(this)
  nav = new NavigationModel()
  shell = new ShellUiModel()
  me = new MeModel(this)
  onboard = new OnboardModel()
  profiles = new ProfilesViewModel(this)
  linkMetas = new LinkMetasViewModel(this)

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
    if (!this.session.hasSession) {
      return
    }
    try {
      if (!this.session.online) {
        await this.session.connect()
      }
      await this.me.fetchStateUpdate()
    } catch (e: any) {
      if (isNetworkError(e)) {
        this.session.setOnline(false) // connection lost
      }
      this.log.error('Failed to fetch latest state', e)
    }
  }

  serialize(): unknown {
    return {
      log: this.log.serialize(),
      session: this.session.serialize(),
      me: this.me.serialize(),
      nav: this.nav.serialize(),
      onboard: this.onboard.serialize(),
      shell: this.shell.serialize(),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'log')) {
        this.log.hydrate(v.log)
      }
      if (hasProp(v, 'me')) {
        this.me.hydrate(v.me)
      }
      if (hasProp(v, 'nav')) {
        this.nav.hydrate(v.nav)
      }
      if (hasProp(v, 'onboard')) {
        this.onboard.hydrate(v.onboard)
      }
      if (hasProp(v, 'session')) {
        this.session.hydrate(v.session)
      }
      if (hasProp(v, 'shell')) {
        this.shell.hydrate(v.shell)
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
