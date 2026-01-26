import {clear, createStore, del, get, set} from 'idb-keyval'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = createStore(id, id)

  return {
    async get(key: string): Promise<string | undefined> {
      return get(key, store) ?? undefined
    },
    async set(key: string, value: string): Promise<void> {
      await set(key, value, store)
    },
    async delete(key: string): Promise<void> {
      await del(key, store)
    },
    async clear(): Promise<void> {
      await clear(store)
    },
  }
}
