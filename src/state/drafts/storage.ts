/**
 * Native file system storage for draft media.
 * Media is stored by localRefPath key (unique identifier stored in server draft).
 */
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy'

import {logger} from '#/logger'

const MEDIA_DIR = 'bsky-draft-media'

function joinPath(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/')
}

function getMediaDirectory(): string {
  return joinPath(documentDirectory!, MEDIA_DIR)
}

function getMediaPath(localRefPath: string): string {
  // Use localRefPath as filename (replace unsafe chars)
  const safeFilename = localRefPath.replace(/[/:]/g, '_')
  return joinPath(getMediaDirectory(), safeFilename)
}

let dirCreated = false

/**
 * Ensure the media directory exists
 */
async function ensureDirectory(): Promise<void> {
  if (dirCreated) return
  await makeDirectoryAsync(getMediaDirectory(), {intermediates: true})
  dirCreated = true
}

/**
 * Save a media file to local storage by localRefPath key
 */
export async function saveMediaToLocal(
  localRefPath: string,
  sourcePath: string,
): Promise<void> {
  await ensureDirectory()

  const destPath = getMediaPath(localRefPath)

  // Ensure source path has file:// prefix for expo-file-system
  let normalizedSource = sourcePath
  if (!sourcePath.startsWith('file://') && sourcePath.startsWith('/')) {
    normalizedSource = `file://${sourcePath}`
  }

  try {
    await copyAsync({from: normalizedSource, to: destPath})
    // Update cache after successful save
    mediaExistsCache.set(localRefPath, true)
  } catch (error) {
    logger.error('Failed to save media to drafts storage', {
      error,
      localRefPath,
      sourcePath: normalizedSource,
      destPath,
    })
    throw error
  }
}

/**
 * Load a media file path from local storage
 * @returns The file path for the saved media
 */
export async function loadMediaFromLocal(
  localRefPath: string,
): Promise<string> {
  const path = getMediaPath(localRefPath)
  const info = await getInfoAsync(path)

  if (!info.exists) {
    throw new Error(`Media file not found: ${localRefPath}`)
  }

  return path
}

/**
 * Delete a media file from local storage
 */
export async function deleteMediaFromLocal(
  localRefPath: string,
): Promise<void> {
  const path = getMediaPath(localRefPath)
  await deleteAsync(path, {idempotent: true})
}

/**
 * Check if a media file exists in local storage (synchronous check using cache)
 * Note: This uses a cached directory listing for performance
 */
const mediaExistsCache = new Map<string, boolean>()
let cachePopulated = false

export function mediaExists(localRefPath: string): boolean {
  // For native, we need an async check but the API requires sync
  // Use cached result if available, otherwise assume exists (will fail on load if not)
  if (mediaExistsCache.has(localRefPath)) {
    return mediaExistsCache.get(localRefPath)!
  }
  // If cache not populated yet, trigger async population and return true optimistically
  if (!cachePopulated) {
    populateCache()
  }
  return false // Conservative: assume doesn't exist if not in cache
}

async function populateCache(): Promise<void> {
  try {
    const {readDirectoryAsync} = await import('expo-file-system/legacy')
    const dir = getMediaDirectory()
    const info = await getInfoAsync(dir)
    if (info.exists) {
      const files = await readDirectoryAsync(dir)
      for (const file of files) {
        // Reverse the safe filename transformation
        const localRefPath = file.replace(/_/g, ':').replace(/_/g, '/')
        mediaExistsCache.set(localRefPath, true)
      }
    }
    cachePopulated = true
  } catch (e) {
    logger.warn('Failed to populate media cache', {error: e})
  }
}

/**
 * Clear the media exists cache (call when media is added/deleted)
 */
export function clearMediaCache(): void {
  mediaExistsCache.clear()
  cachePopulated = false
}
