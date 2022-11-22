import {autorun} from 'mobx'
import {sessionClient as AtpApi} from '../third-party/api'
import type {SessionServiceClient} from '../third-party/api/src/index'
import {RootStoreModel} from './models/root-store'
import * as libapi from './lib/api'
import * as storage from './lib/storage'

export const LOCAL_DEV_SERVICE = 'http://localhost:2583'
export const STAGING_SERVICE = 'https://pds.staging.bsky.dev'
export const PROD_SERVICE = 'https://bsky.social'
export const DEFAULT_SERVICE = PROD_SERVICE
const ROOT_STATE_STORAGE_KEY = 'root'
const STATE_FETCH_INTERVAL = 15e3

export async function setupState() {
  let rootStore: RootStoreModel
  let data: any

  libapi.doPolyfill()

  const api = AtpApi.service(DEFAULT_SERVICE) as SessionServiceClient
  rootStore = new RootStoreModel(api)
  try {
    data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
    rootStore.hydrate(data)
  } catch (e) {
    console.error('Failed to load state from storage', e)
  }

  await rootStore.session.setup()
  // @ts-ignore .on() is correct -prf
  api.sessionManager.on('session', () => {
    if (!api.sessionManager.session && rootStore.session.isAuthed) {
      // reset session
      rootStore.session.clear()
    } else if (api.sessionManager.session) {
      rootStore.session.updateAuthTokens(api.sessionManager.session)
    }
  })

  // track changes & save to storage
  autorun(() => {
    const snapshot = rootStore.serialize()
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot)
  })

  await rootStore.fetchStateUpdate()
  console.log(rootStore.me)

  // periodic state fetch
  setInterval(() => {
    rootStore.fetchStateUpdate()
  }, STATE_FETCH_INTERVAL)

  return rootStore
}

export {useStores, RootStoreModel, RootStoreProvider} from './models/root-store'
