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

const DB_VERSION = 1
const STORE_NAME = 'queries'

const dbCache = new Map<string, Promise<IDBPDatabase<PersistedQueryDB>>>()

function getDB(dbName: string): Promise<IDBPDatabase<PersistedQueryDB>> {
  let dbPromise = dbCache.get(dbName)
  if (!dbPromise) {
    dbPromise = openDB<PersistedQueryDB>(dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
    dbCache.set(dbName, dbPromise)
  }
  return dbPromise
}

/**
 * Creates an IndexedDB-based storage adapter for persisting react-query cache on web platforms.
 * Each storage instance uses a separate IndexedDB database identified by the provided id.
 *
 * @param id - Unique identifier for this storage instance (used as database name)
 */
export function createPersistedQueryStorage(id: string): PersistedQueryStorage {
  const dbName = `bsky_${id}`

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const db = await getDB(dbName)
        const value = await db.get(STORE_NAME, key)
        return value ?? null
      } catch (e) {
        console.error('Failed to get item from IndexedDB:', e)
        return null
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        const db = await getDB(dbName)
        await db.put(STORE_NAME, value, key)
      } catch (e) {
        console.error('Failed to set item in IndexedDB:', e)
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        const db = await getDB(dbName)
        await db.delete(STORE_NAME, key)
      } catch (e) {
        console.error('Failed to remove item from IndexedDB:', e)
      }
    },
  }
}
