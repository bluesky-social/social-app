import {Instance, SnapshotOut, types, flow} from 'mobx-state-tree'
import {UserConfig} from '../../api'
import {withEnvironment} from '../env'

export const SessionModel = types
  .model('Session')
  .props({
    isAuthed: types.boolean,
    uiState: types.enumeration('idle', ['idle', 'working']),
    uiError: types.maybe(types.string),

    // TODO: these should be stored somewhere secret
    serverUrl: types.maybe(types.string),
    secretKeyStr: types.maybe(types.string),
    rootAuthToken: types.maybe(types.string),
  })
  .views(self => ({
    get hasAccount() {
      return self.serverUrl && self.secretKeyStr && self.rootAuthToken
    },
  }))
  .extend(withEnvironment)
  .actions(self => ({
    setAuthed: (v: boolean) => {
      self.isAuthed = v
    },
    loadAccount: flow(function* () {
      if (!self.hasAccount) {
        return false
      }
      self.uiState = 'working'
      self.uiError = undefined
      try {
        const cfg = yield UserConfig.hydrate({
          serverUrl: self.serverUrl,
          secretKeyStr: self.secretKeyStr,
          rootAuthToken: self.rootAuthToken,
        })
        self.environment.api.setUserCfg(cfg)
        self.isAuthed = true
        self.uiState = 'idle'
        return true
      } catch (e: any) {
        console.error('Failed to create test account', e)
        self.uiError = e.toString()
        self.uiState = 'idle'
        return false
      }
    }),
    createTestAccount: flow(function* (serverUrl: string) {
      self.uiState = 'working'
      self.uiError = undefined
      try {
        const cfg = yield UserConfig.createTest(serverUrl)
        const state = yield cfg.serialize()
        self.serverUrl = state.serverUrl
        self.secretKeyStr = state.secretKeyStr
        self.rootAuthToken = state.rootAuthToken
        self.isAuthed = true
        self.environment.api.setUserCfg(cfg)
      } catch (e: any) {
        console.error('Failed to create test account', e)
        self.uiError = e.toString()
      }
      self.uiState = 'idle'
    }),
  }))

export interface Session extends Instance<typeof SessionModel> {}
export interface SessionSnapshot extends SnapshotOut<typeof SessionModel> {}

export function createDefaultSession() {
  return {
    isAuthed: false,
    uiState: 'idle',
  }
}
