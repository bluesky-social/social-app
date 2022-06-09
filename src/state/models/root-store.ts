/**
 * The root store is the base of all modeled state.
 */

import {Instance, SnapshotOut, types} from 'mobx-state-tree'
import {createContext, useContext} from 'react'

export const RootStoreModel = types.model('RootStore').props({})

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}

// react context & hook utilities
const RootStoreContext = createContext<RootStore>({} as RootStore)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)
