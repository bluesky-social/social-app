/**
 * Persisted Query Storage - Web Implementation (IndexedDB)
 *
 * This module provides a storage abstraction for persisting react-query cache.
 * On web platforms, it uses IndexedDB for efficient async storage.
 */
import {type DBSchema, type IDBPDatabase, openDB} from 'idb'

/**
 * Interface for async storage compatible with @tanstack/query-async-storage-persister
 */
export interface PersistedQueryStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

interface PersistedQueryDB extends DBSchema {
  queries: {
    key: string
    value: string
  }
}

const DB_NAME = 'bsky_persisted_queries'
const DB_VERSION = 1
const STORE_NAME = 'queries'

let dbPromise: Promise<IDBPDatabase<PersistedQueryDB>> | null = null

function getDB(): Promise<IDBPDatabase<PersistedQueryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PersistedQueryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

/**
 * IndexedDB-based storage adapter for persisting react-query cache on web platforms.
 */
export const persistedQueryStorage: PersistedQueryStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const db = await getDB()
      const value = await db.get(STORE_NAME, key)
      return value ?? null
    } catch (e) {
      console.error('Failed to get item from IndexedDB:', e)
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const db = await getDB()
      await db.put(STORE_NAME, value, key)
    } catch (e) {
      console.error('Failed to set item in IndexedDB:', e)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, key)
    } catch (e) {
      console.error('Failed to remove item from IndexedDB:', e)
    }
  },
}
