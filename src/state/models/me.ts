import {Instance, SnapshotOut, types, flow, getRoot} from 'mobx-state-tree'
import {RootStore} from './root-store'
import {withEnvironment} from '../env'

export const MeModel = types
  .model('Me')
  .props({
    did: types.maybe(types.string),
    name: types.maybe(types.string),
    displayName: types.maybe(types.string),
    description: types.maybe(types.string),
  })
  .extend(withEnvironment)
  .actions(self => ({
    load: flow(function* () {
      const sess = (getRoot(self) as RootStore).session
      if (sess.isAuthed) {
        // TODO temporary
        const userDb = self.env.adx.mockDb.mainUser
        self.did = userDb.did
        self.name = userDb.name
        const profile = yield self.env.adx
          .repo(self.did, true)
          .collection('blueskyweb.xyz:Profiles')
          .get('Profile', 'profile')
          .catch(_ => undefined)
        if (profile?.valid) {
          self.displayName = profile.value.displayName
          self.description = profile.value.description
        } else {
          self.displayName = ''
          self.description = ''
        }
      } else {
        self.did = undefined
        self.name = undefined
        self.displayName = undefined
        self.description = undefined
      }
    }),
  }))

export interface Me extends Instance<typeof MeModel> {}
export interface MeSnapshot extends SnapshotOut<typeof MeModel> {}

export function createDefaultMe() {
  return {}
}
