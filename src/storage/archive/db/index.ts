import {MMKV} from '@bsky.app/react-native-mmkv'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = new MMKV({id})

  return {
    get(key: string) {
      return store.getString(key)
    },
    set(key: string, value: string) {
      return store.set(key, value)
    },
    delete(key: string) {
      return store.delete(key)
    },
    clear() {
      return store.clearAll()
    },
  }
}
