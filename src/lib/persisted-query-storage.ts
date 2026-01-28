import {create as createArchiveDB} from '#/storage/archive/db'

/**
 * Interface for async storage compatible with @tanstack/query-async-storage-persister
 */
export interface PersistedQueryStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

function createId(id: string) {
  return `react-query-cache-${id}`
}

/**
 * Creates an MMKV-based storage adapter for persisting react-query cache on native platforms.
 * Each storage instance uses a separate MMKV store identified by the provided id.
 * MMKV provides synchronous access but we wrap it in Promises for API compatibility.
 *
 * @param id - Unique identifier for this storage instance (used as MMKV store id)
 */
export function createPersistedQueryStorage(id: string): PersistedQueryStorage {
  const store = createArchiveDB({id: createId(id)})
  return {
    getItem: async (key: string): Promise<string | null> => {
      return (await store.get(key)) ?? null
    },
    setItem: async (key: string, value: string): Promise<void> => {
      await store.set(key, value)
    },
    removeItem: async (key: string): Promise<void> => {
      await store.delete(key)
    },
  }
}

export async function clearPersistedQueryStorage(id: string) {
  const store = createArchiveDB({id: createId(id)})
  await store.clear()
}
