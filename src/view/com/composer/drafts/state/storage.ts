/** Native file-system storage for draft media and account-owned metadata. */
import {Directory, File, Paths} from 'expo-file-system'

import {logger} from './logger'
import {
  type DraftMediaArtifact,
  type DraftMediaMetadata,
  type DraftMediaState,
  isDraftMediaMetadata,
} from './storageTypes'

const MEDIA_DIR = 'bsky-draft-media'
const METADATA_DIR = 'bsky-draft-media-metadata'

function getMediaDirectory(): Directory {
  return new Directory(Paths.document, MEDIA_DIR)
}

function getMetadataDirectory(): Directory {
  return new Directory(Paths.document, METADATA_DIR)
}

function getSafeFilename(localRefPath: string): string {
  return encodeURIComponent(localRefPath)
}

function getMediaFile(localRefPath: string): File {
  return new File(getMediaDirectory(), getSafeFilename(localRefPath))
}

function getMetadataFile(localRefPath: string): File {
  return new File(getMetadataDirectory(), getSafeFilename(localRefPath))
}

let directoriesCreated = false

function ensureDirectories(): void {
  if (directoriesCreated) return
  for (const directory of [getMediaDirectory(), getMetadataDirectory()]) {
    if (!directory.exists) {
      directory.create({intermediates: true, idempotent: true})
    }
  }
  directoriesCreated = true
}

function fileTimestamp(file: File): string | undefined {
  const timestamp = file.creationTime ?? file.lastModified
  return timestamp ? new Date(timestamp).toISOString() : undefined
}

function writeMetadata(metadata: DraftMediaMetadata): Promise<void> {
  ensureDirectories()
  const file = getMetadataFile(metadata.localRefPath)
  file.create({intermediates: true, overwrite: true})
  file.write(JSON.stringify(metadata))
  return Promise.resolve()
}

export async function getMediaMetadata(
  localRefPath: string,
): Promise<DraftMediaMetadata | undefined> {
  const file = getMetadataFile(localRefPath)
  if (!file.exists) return undefined

  try {
    const metadata: unknown = JSON.parse(await file.text())
    return isDraftMediaMetadata(metadata) ? metadata : undefined
  } catch (error) {
    logger.warn('Failed to read draft media metadata', {safeMessage: error})
    return undefined
  }
}

export async function touchMediaMetadata(
  localRefPath: string,
  {
    accountDid,
    deviceId,
    state,
    now = Date.now(),
    createdAt,
  }: {
    accountDid: string
    deviceId: string
    state: DraftMediaState
    now?: number
    createdAt?: string
  },
): Promise<void> {
  const mediaFile = getMediaFile(localRefPath)
  if (!mediaFile.exists) {
    throw new Error('Cannot touch metadata for missing draft media')
  }

  const existing = await getMediaMetadata(localRefPath)
  const touchedAt = new Date(now).toISOString()
  await writeMetadata({
    localRefPath,
    accountDid,
    deviceId,
    createdAt:
      existing?.createdAt || createdAt || fileTimestamp(mediaFile) || touchedAt,
    lastTouchedAt: touchedAt,
    state,
  })
}

export async function saveMediaToLocal(
  localRefPath: string,
  sourcePath: string,
  ownership: {
    accountDid: string
    deviceId: string
    state: DraftMediaState
    now?: number
  },
): Promise<void> {
  ensureDirectories()
  const destFile = getMediaFile(localRefPath)
  let normalizedSource = sourcePath
  if (!sourcePath.startsWith('file://') && sourcePath.startsWith('/')) {
    normalizedSource = `file://${sourcePath}`
  }

  try {
    const sourceFile = new File(normalizedSource)
    await sourceFile.copy(destFile)
    mediaExistsCache.set(localRefPath, true)
    await touchMediaMetadata(localRefPath, ownership)
  } catch (error) {
    logger.error('Failed to save media to drafts storage', {
      safeMessage: error,
    })
    throw error
  }
}

export function loadMediaFromLocal(localRefPath: string): Promise<string> {
  const file = getMediaFile(localRefPath)
  return file.exists
    ? Promise.resolve(file.uri)
    : Promise.reject(new Error(`Media file not found: ${localRefPath}`))
}

export function deleteMediaFromLocal(localRefPath: string): Promise<void> {
  const file = getMediaFile(localRefPath)
  if (file.exists) file.delete()
  const metadataFile = getMetadataFile(localRefPath)
  if (metadataFile.exists) metadataFile.delete()
  mediaExistsCache.delete(localRefPath)
  return Promise.resolve()
}

export async function listMediaArtifacts(): Promise<DraftMediaArtifact[]> {
  ensureDirectories()
  const artifacts: DraftMediaArtifact[] = []
  for (const item of getMediaDirectory().list()) {
    if (!(item instanceof File)) continue
    const localRefPath = decodeURIComponent(item.name)
    artifacts.push({
      localRefPath,
      metadata: await getMediaMetadata(localRefPath),
      fileCreatedAt: fileTimestamp(item),
    })
  }
  return artifacts
}

const mediaExistsCache = new Map<string, boolean>()
let cachePopulated = false
let populateCachePromise: Promise<void> | null = null

export function mediaExists(localRefPath: string): boolean {
  if (mediaExistsCache.has(localRefPath)) {
    return mediaExistsCache.get(localRefPath)!
  }
  if (!cachePopulated && !populateCachePromise) {
    populateCachePromise = populateCacheInternal()
  }
  return false
}

function populateCacheInternal(): Promise<void> {
  return new Promise(resolve => {
    try {
      const dir = getMediaDirectory()
      if (dir.exists) {
        for (const item of dir.list()) {
          if (!(item instanceof File)) continue
          mediaExistsCache.set(decodeURIComponent(item.name), true)
        }
      }
      cachePopulated = true
    } catch (error) {
      logger.warn('Failed to populate media cache', {safeMessage: error})
    }
    resolve()
  })
}

export async function ensureMediaCachePopulated(): Promise<void> {
  if (cachePopulated) return
  if (!populateCachePromise) {
    populateCachePromise = populateCacheInternal()
  }
  await populateCachePromise
}

export function clearMediaCache(): void {
  mediaExistsCache.clear()
  cachePopulated = false
  populateCachePromise = null
}

export function revokeMediaUrl(_url: string): void {}

export function revokeAllMediaUrls(): void {}
