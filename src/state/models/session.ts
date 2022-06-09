import {Instance, SnapshotOut, types} from 'mobx-state-tree'

export const SessionModel = types
  .model('Session')
  .props({
    isAuthed: types.boolean,
  })
  .actions(self => ({
    setAuthed: (v: boolean) => {
      self.isAuthed = v
    },
  }))

export interface Session extends Instance<typeof SessionModel> {}
export interface SessionSnapshot extends SnapshotOut<typeof SessionModel> {}

export function createDefaultSession() {
  return {
    isAuthed: false,
  }
}
