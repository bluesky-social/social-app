/**
 * Web IndexedDB storage for draft media.
 * Media is stored by localRefPath key (unique identifier stored in server draft).
 */
import {type DBSchema, type IDBPDatabase, openDB} from 'idb'

import {logger} from './logger'

const DB_NAME = 'bsky-draft-media'
const DB_VERSION = 1

interface DraftMediaDB extends DBSchema {
  media: {
    key: string // localRefPath
    value: {
      blob: Blob
      createdAt: string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<DraftMediaDB>> | null = null

async function getDB(): Promise<IDBPDatabase<DraftMediaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftMediaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media')
        }
      },
    })
  }
  return dbPromise
}

/**
 * Convert a path/URL to a Blob
 */
async function toBlob(sourcePath: string): Promise<Blob> {
  // Handle data URIs directly
  if (sourcePath.startsWith('data:')) {
    const response = await fetch(sourcePath)
    return response.blob()
  }

  // Handle blob URLs
  if (sourcePath.startsWith('blob:')) {
    try {
      const response = await fetch(sourcePath)
      return response.blob()
    } catch (e) {
      logger.error('Failed to fetch blob URL - it may have been revoked', {
        error: e,
        sourcePath,
      })
      throw e
    }
  }

  // Handle regular URLs
  const response = await fetch(sourcePath)
  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status}`)
  }
  return response.blob()
}

/**
 * Save a media file to IndexedDB by localRefPath key
 */
export async function saveMediaToLocal(
  localRefPath: string,
  sourcePath: string,
): Promise<void> {
  const db = await getDB()

  let blob: Blob
  try {
    blob = await toBlob(sourcePath)
  } catch (error) {
    logger.error('Failed to convert source to blob', {
      error,
      localRefPath,
      sourcePath,
    })
    throw error
  }

  try {
    await db.put(
      'media',
      {
        blob,
        createdAt: new Date().toISOString(),
      },
      localRefPath,
    )
    // Update cache
    mediaExistsCache.set(localRefPath, true)
  } catch (error) {
    logger.error('Failed to save media to IndexedDB', {error, localRefPath})
    throw error
  }
}

/**
 * Load a media file from IndexedDB
 * @returns A blob URL for the saved media
 */
export async function loadMediaFromLocal(
  localRefPath: string,
): Promise<string> {
  const db = await getDB()
  const record = await db.get('media', localRefPath)

  if (!record) {
    throw new Error(`Media file not found: ${localRefPath}`)
  }

  return URL.createObjectURL(record.blob)
}

/**
 * Delete a media file from IndexedDB
 */
export async function deleteMediaFromLocal(
  localRefPath: string,
): Promise<void> {
  const db = await getDB()
  await db.delete('media', localRefPath)
  mediaExistsCache.delete(localRefPath)
}

/**
 * Check if a media file exists in IndexedDB (synchronous check using cache)
 */
const mediaExistsCache = new Map<string, boolean>()
let cachePopulated = false
let populateCachePromise: Promise<void> | null = null

export function mediaExists(localRefPath: string): boolean {
  if (mediaExistsCache.has(localRefPath)) {
    return mediaExistsCache.get(localRefPath)!
  }
  // If cache not populated yet, trigger async population
  if (!cachePopulated && !populateCachePromise) {
    populateCachePromise = populateCacheInternal()
  }
  return false // Conservative: assume doesn't exist if not in cache
}

async function populateCacheInternal(): Promise<void> {
  try {
    const db = await getDB()
    const keys = await db.getAllKeys('media')
    for (const key of keys) {
      mediaExistsCache.set(key, true)
    }
    cachePopulated = true
  } catch (e) {
    logger.warn('Failed to populate media cache', {error: e})
  }
}

/**
 * Ensure the media cache is populated. Call this before checking mediaExists.
 */
export async function ensureMediaCachePopulated(): Promise<void> {
  if (cachePopulated) return
  if (!populateCachePromise) {
    populateCachePromise = populateCacheInternal()
  }
  await populateCachePromise
}

/**
 * Clear the media exists cache (call when media is added/deleted)
 */
export function clearMediaCache(): void {
  mediaExistsCache.clear()
  cachePopulated = false
  populateCachePromise = null
}

/**
 * Revoke a blob URL when done with it (to prevent memory leaks)
 */
export function revokeMediaUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
