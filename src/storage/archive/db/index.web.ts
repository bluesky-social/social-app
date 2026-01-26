import {clear, createStore, del, get, set} from 'idb-keyval'

import {type DB} from '#/storage/archive/db/types'

export function create({id}: {id: string}): DB {
  const store = createStore(id, id)

  return {
    get(key: string) {
      return get(key, store)
    },
    set(key: string, value: string) {
      return set(key, value, store)
    },
    delete(key: string) {
      return del(key, store)
    },
    clear() {
      return clear(store)
    },
  }
}
