import {clear, createStore, del, get, set} from 'idb-keyval'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = createStore(id, id)

  return {
    async get(key: string): Promise<string | undefined> {
      return get(key, store)
    },
    async set(key: string, value: string): Promise<void> {
      return set(key, value, store)
    },
    async delete(key: string): Promise<void> {
      return del(key, store)
    },
    async clear(): Promise<void> {
      return clear(store)
    },
  }
}
