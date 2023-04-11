import {autorun} from 'mobx'
import {AppState, Platform} from 'react-native'
import {BskyAgent} from '@atproto/api'
import {RootStoreModel} from './models/root-store'
import * as apiPolyfill from 'lib/api/api-polyfill'
import * as storage from 'lib/storage'

export const LOCAL_DEV_SERVICE =
  Platform.OS === 'android' ? 'http://10.0.2.2:2583' : 'http://localhost:2583'
export const STAGING_SERVICE = 'https://pds.staging.bsky.dev'
export const PROD_SERVICE = 'https://bsky.social'
export const DEFAULT_SERVICE = PROD_SERVICE
const ROOT_STATE_STORAGE_KEY = 'root'
const STATE_FETCH_INTERVAL = 15e3

export async function setupState(serviceUri = DEFAULT_SERVICE) {
  let rootStore: RootStoreModel
  let data: any

  apiPolyfill.doPolyfill()

  rootStore = new RootStoreModel(new BskyAgent({service: serviceUri}))
  try {
    data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
    rootStore.log.debug('Initial hydrate', {hasSession: !!data.session})
    rootStore.hydrate(data)
  } catch (e: any) {
    rootStore.log.error('Failed to load state from storage', e)
  }
  rootStore.attemptSessionResumption()

  // track changes & save to storage
  autorun(() => {
    const snapshot = rootStore.serialize()
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot)
  })

  // periodic state fetch
  setInterval(() => {
    // NOTE
    // this must ONLY occur when the app is active, as the bg-fetch handler
    // will wake up the thread and cause this interval to fire, which in
    // turn schedules a bunch of work at a poor time
    // -prf
    if (AppState.currentState === 'active') {
      rootStore.updateSessionState()
    }
  }, STATE_FETCH_INTERVAL)

  return rootStore
}

export {useStores, RootStoreModel, RootStoreProvider} from './models/root-store'
