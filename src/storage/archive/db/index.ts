import {MMKV} from '@bsky.app/react-native-mmkv'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = new MMKV({id})

  return {
    async get(key: string): Promise<string | undefined> {
      return store.getString(key) ?? undefined
    },
    async set(key: string, value: string): Promise<void> {
      store.set(key, value)
    },
    async delete(key: string): Promise<void> {
      store.delete(key)
    },
    async clear(): Promise<void> {
      store.clearAll()
    },
  }
}
