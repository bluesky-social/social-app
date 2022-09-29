import {autorun} from 'mobx'
import AdxApi from '../third-party/api'
import {RootStoreModel} from './models/root-store'
import * as libapi from './lib/api'
import * as storage from './lib/storage'
// import * as auth from './auth' TODO

import {ShellModel} from './models/shell'

const ROOT_STATE_STORAGE_KEY = 'root'
const DEFAULT_SERVICE = 'http://localhost:2583'

export async function setupState() {
  let rootStore: RootStoreModel
  let data: any

  libapi.doPolyfill()

  const api = AdxApi.service(DEFAULT_SERVICE)
  rootStore = new RootStoreModel(api)
  try {
    data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
    rootStore.hydrate(data)
  } catch (e) {
    console.error('Failed to load state from storage', e)
  }

  // track changes & save to storage
  autorun(() => {
    const snapshot = rootStore.serialize()
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot)
  })

  await rootStore.session.setup()
  console.log(rootStore.me)

  return rootStore
}

export {useStores, RootStoreModel, RootStoreProvider} from './models/root-store'
