import {MMKV} from '@bsky.app/react-native-mmkv'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = new MMKV({id})

  return {
    async get(key: string): Promise<string | undefined> {
      return store.getString(key)
    },
    async set(key: string, value: string): Promise<void> {
      return store.set(key, value)
    },
    async delete(key: string): Promise<void> {
      return store.delete(key)
    },
    async clear(): Promise<void> {
      return store.clearAll()
    },
  }
}
