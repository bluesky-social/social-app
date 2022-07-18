import {Instance, SnapshotOut, types, flow} from 'mobx-state-tree'
// import {UserConfig} from '../../api'
import * as auth from '../lib/auth'
import {withEnvironment} from '../env'

export const SessionModel = types
  .model('Session')
  .props({
    isAuthed: types.boolean,
    uiIsProcessing: types.maybe(types.boolean),
    uiError: types.maybe(types.string),

    // TODO: these should be stored somewhere secret
    serverUrl: types.maybe(types.string),
    secretKeyStr: types.maybe(types.string),
    rootAuthToken: types.maybe(types.string),
  })
  .extend(withEnvironment)
  .actions(self => ({
    setAuthed: (v: boolean) => {
      self.isAuthed = v
    },
    login: flow(function* () {
      self.uiIsProcessing = true
      self.uiError = undefined
      try {
        if (!self.env.authStore) {
          throw new Error('Auth store not initialized')
        }
        const res = yield auth.requestAppUcan(self.env.authStore)
        self.isAuthed = res
        self.uiIsProcessing = false
        return res
      } catch (e: any) {
        console.error('Failed to request app ucan', e)
        self.uiError = e.toString()
        self.uiIsProcessing = false
        return false
      }
    }),
    logout: flow(function* () {
      self.uiIsProcessing = true
      self.uiError = undefined
      try {
        if (!self.env.authStore) {
          throw new Error('Auth store not initialized')
        }
        const res = yield auth.logout(self.env.authStore)
        self.isAuthed = false
        self.uiIsProcessing = false
        return res
      } catch (e: any) {
        console.error('Failed to log out', e)
        self.uiError = e.toString()
        self.uiIsProcessing = false
        return false
      }
    }),
    /*loadAccount: flow(function* () {
      self.uiIsProcessing = true
      self.uiError = undefined
      try {
        // const cfg = yield UserConfig.hydrate({
        //   serverUrl: self.serverUrl,
        //   secretKeyStr: self.secretKeyStr,
        //   rootAuthToken: self.rootAuthToken,
        // })
        // self.env.api.setUserCfg(cfg)
        self.isAuthed = true
        self.uiIsProcessing = false
        return true
      } catch (e: any) {
        console.error('Failed to create test account', e)
        self.uiError = e.toString()
        self.uiIsProcessing = false
        return false
      }
    }),
    createTestAccount: flow(function* (_serverUrl: string) {
      self.uiIsProcessing = true
      self.uiError = undefined
      try {
        // const cfg = yield UserConfig.createTest(serverUrl)
        // const state = yield cfg.serialize()
        // self.serverUrl = state.serverUrl
        // self.secretKeyStr = state.secretKeyStr
        // self.rootAuthToken = state.rootAuthToken
        self.isAuthed = true
        // self.env.api.setUserCfg(cfg)
      } catch (e: any) {
        console.error('Failed to create test account', e)
        self.uiError = e.toString()
      }
      self.uiIsProcessing = false
    }),*/
  }))

export interface Session extends Instance<typeof SessionModel> {}
export interface SessionSnapshot extends SnapshotOut<typeof SessionModel> {}

export function createDefaultSession() {
  return {
    isAuthed: false,
    uiState: 'idle',
  }
}
