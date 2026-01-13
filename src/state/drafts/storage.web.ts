import {type DBSchema, type IDBPDatabase, openDB} from 'idb'
import {nanoid} from 'nanoid/non-secure'

import {logger} from '#/logger'
import {
  type DraftPostDisplay,
  type DraftSummary,
  type StoredDraft,
} from './schema'

const DB_NAME = 'bsky-drafts'
const DB_VERSION = 1

interface DraftsDB extends DBSchema {
  'draft-media': {
    key: string // "{accountDid}:{localId}"
    value: {
      blob: Blob
      mimeType: string
      createdAt: string
    }
  }
  'draft-meta': {
    key: string // "{accountDid}:{draftId}"
    value: StoredDraft
    indexes: {
      'by-account': string
      'by-updated': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<DraftsDB>> | null = null

async function getDB(): Promise<IDBPDatabase<DraftsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create media store
        if (!db.objectStoreNames.contains('draft-media')) {
          db.createObjectStore('draft-media')
        }

        // Create meta store with indexes
        if (!db.objectStoreNames.contains('draft-meta')) {
          const metaStore = db.createObjectStore('draft-meta')
          metaStore.createIndex('by-account', 'accountDid')
          metaStore.createIndex('by-updated', 'updatedAt')
        }
      },
    })
  }
  return dbPromise
}

function mediaKey(accountDid: string, localId: string): string {
  return `${accountDid}:${localId}`
}

function draftKey(accountDid: string, draftId: string): string {
  return `${accountDid}:${draftId}`
}

/**
 * Convert a data URI or blob URL to a Blob
 */
async function toBlob(input: string | Blob): Promise<Blob> {
  if (input instanceof Blob) {
    return input
  }
  const response = await fetch(input)
  return response.blob()
}

/**
 * Save a media file to IndexedDB
 * @returns The local ID for the saved media
 */
export async function saveMediaToLocal(
  accountDid: string,
  source: string | Blob,
  mimeType: string,
): Promise<string> {
  const db = await getDB()
  const localId = nanoid()
  const blob = await toBlob(source)

  try {
    await db.put(
      'draft-media',
      {
        blob,
        mimeType,
        createdAt: new Date().toISOString(),
      },
      mediaKey(accountDid, localId),
    )
    return localId
  } catch (error) {
    logger.error('Failed to save media to IndexedDB', {error})
    throw error
  }
}

/**
 * Load a media file from IndexedDB
 * @returns A blob URL for the saved media
 */
export async function loadMediaFromLocal(
  accountDid: string,
  localId: string,
): Promise<string> {
  const db = await getDB()
  const record = await db.get('draft-media', mediaKey(accountDid, localId))

  if (!record) {
    throw new Error(`Media file not found: ${localId}`)
  }

  return URL.createObjectURL(record.blob)
}

/**
 * Delete a media file from IndexedDB
 */
export async function deleteMediaFromLocal(
  accountDid: string,
  localId: string,
): Promise<void> {
  const db = await getDB()
  await db.delete('draft-media', mediaKey(accountDid, localId))
}

/**
 * Save draft metadata to IndexedDB
 */
export async function saveDraftMeta(
  accountDid: string,
  draft: StoredDraft,
): Promise<void> {
  const db = await getDB()

  try {
    await db.put('draft-meta', draft, draftKey(accountDid, draft.id))
  } catch (error) {
    logger.error('Failed to save draft metadata', {error, draftId: draft.id})
    throw error
  }
}

/**
 * Load draft metadata from IndexedDB
 */
export async function loadDraftMeta(
  accountDid: string,
  draftId: string,
): Promise<StoredDraft | null> {
  const db = await getDB()

  try {
    const draft = await db.get('draft-meta', draftKey(accountDid, draftId))
    return draft || null
  } catch (error) {
    logger.error('Failed to load draft metadata', {error, draftId})
    return null
  }
}

/**
 * List all drafts for an account
 */
export async function listDrafts(accountDid: string): Promise<DraftSummary[]> {
  const db = await getDB()

  try {
    const allDrafts = await db.getAllFromIndex(
      'draft-meta',
      'by-account',
      accountDid,
    )

    const summaries: DraftSummary[] = allDrafts.map(draft =>
      createDraftSummary(draft),
    )

    // Sort by updatedAt descending (most recent first)
    summaries.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )

    return summaries
  } catch (error) {
    logger.error('Failed to list drafts', {error, accountDid})
    return []
  }
}

/**
 * Delete a draft and all its associated media
 */
export async function deleteDraft(
  accountDid: string,
  draftId: string,
): Promise<void> {
  const db = await getDB()

  // First, load the draft to find associated media
  const draft = await loadDraftMeta(accountDid, draftId)

  if (draft) {
    // Delete all associated media
    for (const post of draft.posts) {
      if (post.images) {
        for (const image of post.images) {
          await deleteMediaFromLocal(accountDid, image.localId)
        }
      }
      if (post.video) {
        await deleteMediaFromLocal(accountDid, post.video.localId)
        // Delete caption files too
        if (post.video.captions) {
          for (const caption of post.video.captions) {
            await deleteMediaFromLocal(accountDid, caption.localId)
          }
        }
      }
    }
  }

  // Delete the draft metadata
  await db.delete('draft-meta', draftKey(accountDid, draftId))
}

/**
 * Delete all drafts for an account
 */
export async function deleteAllDrafts(accountDid: string): Promise<void> {
  const db = await getDB()

  // Get all drafts for this account
  const drafts = await db.getAllFromIndex(
    'draft-meta',
    'by-account',
    accountDid,
  )

  // Delete each draft and its media
  for (const draft of drafts) {
    await deleteDraft(accountDid, draft.id)
  }
}

/**
 * Get the total storage size used by drafts (approximate)
 */
export async function getDraftsStorageSize(
  accountDid: string,
): Promise<number> {
  const db = await getDB()

  try {
    // This is an approximation - we sum the blob sizes
    const tx = db.transaction('draft-media', 'readonly')
    const store = tx.objectStore('draft-media')
    let cursor = await store.openCursor()
    let totalSize = 0

    while (cursor) {
      const key = cursor.key as string
      if (key.startsWith(`${accountDid}:`)) {
        totalSize += cursor.value.blob.size
      }
      cursor = await cursor.continue()
    }

    return totalSize
  } catch (error) {
    logger.error('Failed to calculate drafts storage size', {error, accountDid})
    return 0
  }
}

/**
 * Create a summary from a full draft
 */
function createDraftSummary(draft: StoredDraft): DraftSummary {
  const firstPost = draft.posts[0]
  const previewText = firstPost?.richtext.text.slice(0, 100) || ''

  let mediaCount = 0
  let hasMedia = false

  const posts: DraftPostDisplay[] = []

  for (const post of draft.posts) {
    if (post.images) {
      mediaCount += post.images.length
      hasMedia = true
    }
    if (post.video) {
      mediaCount += 1
      hasMedia = true
    }
    if (post.gif) {
      mediaCount += 1
      hasMedia = true
    }

    posts.push({
      id: post.id,
      text: post.richtext.text,
      images: post.images,
      video: post.video,
      gif: post.gif,
    })
  }

  return {
    id: draft.id,
    previewText,
    hasMedia,
    mediaCount,
    postCount: draft.posts.length,
    isReply: Boolean(draft.replyToUri),
    replyToHandle: draft.replyToAuthor?.handle,
    updatedAt: draft.updatedAt,
    posts,
  }
}

/**
 * Check if a media file exists in IndexedDB
 */
export async function mediaExists(
  accountDid: string,
  localId: string,
): Promise<boolean> {
  const db = await getDB()
  const record = await db.get('draft-media', mediaKey(accountDid, localId))
  return record !== undefined
}

/**
 * Revoke a blob URL when done with it (to prevent memory leaks)
 */
export function revokeMediaUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Extract the localId from a path if it's already in drafts media storage
 * For web, this always returns null since blob URLs don't contain localId
 * The hooks layer handles tracking of web localIds separately
 */
export function extractLocalIdFromPath(
  _accountDid: string,
  _path: string,
): string | null {
  // Web uses blob URLs which don't contain the localId
  // Tracking is done via loadedMediaMap in hooks.ts
  return null
}
