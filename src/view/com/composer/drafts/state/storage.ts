/**
 * Native file system storage for draft media.
 * Media is stored by localRefPath key (unique identifier stored in server draft).
 */
import {Directory, File, Paths} from 'expo-file-system'

import {logger} from './logger'

const MEDIA_DIR = 'bsky-draft-media'

function getMediaDirectory(): Directory {
  return new Directory(Paths.document, MEDIA_DIR)
}

function getMediaFile(localRefPath: string): File {
  const safeFilename = encodeURIComponent(localRefPath)
  return new File(getMediaDirectory(), safeFilename)
}

let dirCreated = false

/**
 * Ensure the media directory exists
 */
function ensureDirectory(): void {
  if (dirCreated) return
  const dir = getMediaDirectory()
  if (!dir.exists) {
    dir.create()
  }
  dirCreated = true
}

/**
 * Save a media file to local storage by localRefPath key
 */
export async function saveMediaToLocal(
  localRefPath: string,
  sourcePath: string,
): Promise<void> {
  ensureDirectory()

  const destFile = getMediaFile(localRefPath)

  // Ensure source path has file:// prefix for expo-file-system
  let normalizedSource = sourcePath
  if (!sourcePath.startsWith('file://') && sourcePath.startsWith('/')) {
    normalizedSource = `file://${sourcePath}`
  }

  try {
    const sourceFile = new File(normalizedSource)
    sourceFile.copy(destFile)
    // Update cache after successful save
    mediaExistsCache.set(localRefPath, true)
  } catch (error) {
    logger.error('Failed to save media to drafts storage', {
      error,
      localRefPath,
      sourcePath: normalizedSource,
      destPath: destFile.uri,
    })
    throw error
  }
}

/**
 * Load a media file path from local storage
 * @returns The file URI for the saved media
 */
export async function loadMediaFromLocal(
  localRefPath: string,
): Promise<string> {
  const file = getMediaFile(localRefPath)

  if (!file.exists) {
    throw new Error(`Media file not found: ${localRefPath}`)
  }

  return file.uri
}

/**
 * Delete a media file from local storage
 */
export async function deleteMediaFromLocal(
  localRefPath: string,
): Promise<void> {
  const file = getMediaFile(localRefPath)
  // Idempotent: only delete if file exists
  if (file.exists) {
    file.delete()
  }
}

/**
 * Check if a media file exists in local storage (synchronous check using cache)
 * Note: This uses a cached directory listing for performance
 */
const mediaExistsCache = new Map<string, boolean>()
let cachePopulated = false

export function mediaExists(localRefPath: string): boolean {
  // For native, we need an async check but the API requires sync
  // Use cached result if available, otherwise assume doesn't exist
  if (mediaExistsCache.has(localRefPath)) {
    return mediaExistsCache.get(localRefPath)!
  }
  // If cache not populated yet, trigger async population
  if (!cachePopulated && !populateCachePromise) {
    populateCachePromise = populateCacheInternal()
  }
  return false // Conservative: assume doesn't exist if not in cache
}

let populateCachePromise: Promise<void> | null = null

function populateCacheInternal(): Promise<void> {
  return new Promise(resolve => {
    try {
      const dir = getMediaDirectory()
      if (dir.exists) {
        const items = dir.list()
        for (const item of items) {
          // Reverse the URL encoding to get the original localRefPath
          const localRefPath = decodeURIComponent(item.name)
          mediaExistsCache.set(localRefPath, true)
        }
      }
      cachePopulated = true
    } catch (e) {
      logger.warn('Failed to populate media cache', {error: e})
    }
    resolve()
  })
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
