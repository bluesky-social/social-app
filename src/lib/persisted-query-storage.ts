/**
 * Persisted Query Storage - Native Implementation (MMKV)
 *
 * This module provides a storage abstraction for persisting react-query cache.
 * On native platforms, it uses MMKV for high-performance synchronous storage.
 */
import {MMKV} from '@bsky.app/react-native-mmkv'

/**
 * Interface for async storage compatible with @tanstack/query-async-storage-persister
 */
export interface PersistedQueryStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * Creates an MMKV-based storage adapter for persisting react-query cache on native platforms.
 * Each storage instance uses a separate MMKV store identified by the provided id.
 * MMKV provides synchronous access but we wrap it in Promises for API compatibility.
 *
 * @param id - Unique identifier for this storage instance (used as MMKV store id)
 */
export function createPersistedQueryStorage(id: string): PersistedQueryStorage {
  const mmkv = new MMKV({id})

  return {
    getItem: async (key: string): Promise<string | null> => {
      return mmkv.getString(key) ?? null
    },
    setItem: async (key: string, value: string): Promise<void> => {
      mmkv.set(key, value)
    },
    removeItem: async (key: string): Promise<void> => {
      mmkv.delete(key)
    },
  }
}
