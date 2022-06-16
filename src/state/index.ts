import {onSnapshot} from 'mobx-state-tree'
import {
  RootStoreModel,
  RootStore,
  createDefaultRootStore,
} from './models/root-store'
import {Environment} from './env'
import * as storage from './storage'
import * as auth from './auth'

const ROOT_STATE_STORAGE_KEY = 'root'

export async function setupState() {
  let rootStore: RootStore
  let data: any

  const env = new Environment()
  await env.setup()
  try {
    data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
    rootStore = RootStoreModel.create(data, env)
  } catch (e) {
    console.error('Failed to load state from storage', e)
    rootStore = RootStoreModel.create(createDefaultRootStore(), env)
  }

  // track changes & save to storage
  onSnapshot(rootStore, snapshot =>
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot),
  )

  if (env.authStore) {
    const isAuthed = await auth.isAuthed(env.authStore)
    rootStore.session.setAuthed(isAuthed)

    // handle redirect from auth
    if (await auth.initialLoadUcanCheck(env.authStore)) {
      rootStore.session.setAuthed(true)
    }
  }

  return rootStore
}

export {useStores, RootStoreModel, RootStoreProvider} from './models/root-store'
export type {RootStore} from './models/root-store'
