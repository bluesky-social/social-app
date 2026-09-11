/** Web IndexedDB storage for draft media and account-owned metadata. */
import {createStore, del, get, keys, set} from 'idb-keyval'

import {logger} from './logger'
import {
  type DraftMediaArtifact,
  type DraftMediaMetadata,
  type DraftMediaState,
  isDraftMediaMetadata,
} from './storageTypes'

const DB_NAME = 'bsky-draft-media'
const STORE_NAME = 'media'

type MediaRecord = {
  blob: Blob
  /** Present on records created before lifecycle metadata was introduced. */
  createdAt?: string
  metadata?: DraftMediaMetadata
}

const store = createStore(DB_NAME, STORE_NAME)

async function toBlob(sourcePath: string): Promise<Blob> {
  const response = await fetch(sourcePath)
  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status}`)
  }
  return response.blob()
}

export async function getMediaMetadata(
  localRefPath: string,
): Promise<DraftMediaMetadata | undefined> {
  const record = await get<MediaRecord>(localRefPath, store)
  return isDraftMediaMetadata(record?.metadata) ? record.metadata : undefined
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
  const record = await get<MediaRecord>(localRefPath, store)
  if (!record) {
    throw new Error('Cannot touch metadata for missing draft media')
  }

  const touchedAt = new Date(now).toISOString()
  const existing = isDraftMediaMetadata(record.metadata)
    ? record.metadata
    : undefined
  const metadata: DraftMediaMetadata = {
    localRefPath,
    accountDid,
    deviceId,
    createdAt:
      existing?.createdAt || createdAt || record.createdAt || touchedAt,
    lastTouchedAt: touchedAt,
    state,
  }
  await set(localRefPath, {...record, metadata}, store)
}

export async function saveMediaToLocal(
  localRefPath: string,
  sourcePath: string,
  {
    accountDid,
    deviceId,
    state,
    now = Date.now(),
  }: {
    accountDid: string
    deviceId: string
    state: DraftMediaState
    now?: number
  },
): Promise<void> {
  try {
    const blob = await toBlob(sourcePath)
    const createdAt = new Date(now).toISOString()
    await set(
      localRefPath,
      {
        blob,
        createdAt,
        metadata: {
          localRefPath,
          accountDid,
          deviceId,
          createdAt,
          lastTouchedAt: createdAt,
          state,
        },
      } satisfies MediaRecord,
      store,
    )
    mediaExistsCache.set(localRefPath, true)
  } catch (error) {
    logger.error('Failed to save media to IndexedDB', {safeMessage: error})
    throw error
  }
}

const createdBlobUrls = new Set<string>()

export async function loadMediaFromLocal(
  localRefPath: string,
): Promise<string> {
  const record = await get<MediaRecord>(localRefPath, store)
  if (!record) {
    throw new Error(`Media file not found: ${localRefPath}`)
  }

  const url = URL.createObjectURL(record.blob)
  createdBlobUrls.add(url)
  return url
}

export async function deleteMediaFromLocal(
  localRefPath: string,
): Promise<void> {
  await del(localRefPath, store)
  mediaExistsCache.delete(localRefPath)
}

export async function listMediaArtifacts(): Promise<DraftMediaArtifact[]> {
  const artifacts: DraftMediaArtifact[] = []
  for (const key of await keys(store)) {
    if (typeof key !== 'string') continue
    const record = await get<MediaRecord>(key, store)
    if (!record) continue
    artifacts.push({
      localRefPath: key,
      metadata: isDraftMediaMetadata(record.metadata)
        ? record.metadata
        : undefined,
      fileCreatedAt: record.createdAt,
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

async function populateCacheInternal(): Promise<void> {
  try {
    for (const key of await keys(store)) {
      if (typeof key === 'string') mediaExistsCache.set(key, true)
    }
    cachePopulated = true
  } catch (error) {
    logger.warn('Failed to populate media cache', {safeMessage: error})
  }
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

export function revokeMediaUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
    createdBlobUrls.delete(url)
  }
}

export function revokeAllMediaUrls(): void {
  for (const url of createdBlobUrls) {
    URL.revokeObjectURL(url)
  }
  createdBlobUrls.clear()
}
