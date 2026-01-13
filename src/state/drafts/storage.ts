import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  readDirectoryAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy'
import {nanoid} from 'nanoid/non-secure'

import {logger} from '#/logger'
import {
  type DraftPostDisplay,
  type DraftSummary,
  type StoredDraft,
} from './schema'

const DRAFTS_DIR = 'bsky-drafts'

function joinPath(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/')
}

function getDraftsDirectory(accountDid: string): string {
  return joinPath(documentDirectory!, DRAFTS_DIR, accountDid)
}

function getMediaDirectory(accountDid: string): string {
  return joinPath(getDraftsDirectory(accountDid), 'media')
}

function getMediaPath(accountDid: string, localId: string): string {
  return joinPath(getMediaDirectory(accountDid), localId)
}

function getDraftsMetaDirectory(accountDid: string): string {
  return joinPath(getDraftsDirectory(accountDid), 'drafts')
}

function getDraftMetaPath(accountDid: string, draftId: string): string {
  return joinPath(getDraftsMetaDirectory(accountDid), `${draftId}.json`)
}

/**
 * Ensure the drafts directories exist
 */
async function ensureDirectories(accountDid: string): Promise<void> {
  await makeDirectoryAsync(getMediaDirectory(accountDid), {intermediates: true})
  await makeDirectoryAsync(getDraftsMetaDirectory(accountDid), {
    intermediates: true,
  })
}

/**
 * Save a media file to local storage
 * @returns The local ID for the saved media
 */
export async function saveMediaToLocal(
  accountDid: string,
  sourcePath: string,
  _mimeType: string,
): Promise<string> {
  await ensureDirectories(accountDid)

  const localId = nanoid()
  const destPath = getMediaPath(accountDid, localId)

  try {
    await copyAsync({from: sourcePath, to: destPath})
    return localId
  } catch (error) {
    logger.error('Failed to save media to drafts storage', {
      error,
      sourcePath,
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
  accountDid: string,
  localId: string,
): Promise<string> {
  const path = getMediaPath(accountDid, localId)
  const info = await getInfoAsync(path)

  if (!info.exists) {
    throw new Error(`Media file not found: ${localId}`)
  }

  return path
}

/**
 * Delete a media file from local storage
 */
export async function deleteMediaFromLocal(
  accountDid: string,
  localId: string,
): Promise<void> {
  const path = getMediaPath(accountDid, localId)
  await deleteAsync(path, {idempotent: true})
}

/**
 * Save draft metadata to local storage
 */
export async function saveDraftMeta(
  accountDid: string,
  draft: StoredDraft,
): Promise<void> {
  await ensureDirectories(accountDid)

  const path = getDraftMetaPath(accountDid, draft.id)

  try {
    await writeAsStringAsync(path, JSON.stringify(draft))
  } catch (error) {
    logger.error('Failed to save draft metadata', {error, draftId: draft.id})
    throw error
  }
}

/**
 * Load draft metadata from local storage
 */
export async function loadDraftMeta(
  accountDid: string,
  draftId: string,
): Promise<StoredDraft | null> {
  const path = getDraftMetaPath(accountDid, draftId)
  const info = await getInfoAsync(path)

  if (!info.exists) {
    return null
  }

  try {
    const content = await readAsStringAsync(path)
    return JSON.parse(content) as StoredDraft
  } catch (error) {
    logger.error('Failed to load draft metadata', {error, draftId})
    return null
  }
}

/**
 * List all drafts for an account
 */
export async function listDrafts(accountDid: string): Promise<DraftSummary[]> {
  const draftsDir = getDraftsMetaDirectory(accountDid)
  const info = await getInfoAsync(draftsDir)

  if (!info.exists) {
    return []
  }

  try {
    const files = await readDirectoryAsync(draftsDir)
    const summaries: DraftSummary[] = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const draftId = file.replace('.json', '')
      const draft = await loadDraftMeta(accountDid, draftId)

      if (draft) {
        summaries.push(createDraftSummary(draft))
      }
    }

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
  const path = getDraftMetaPath(accountDid, draftId)
  await deleteAsync(path, {idempotent: true})
}

/**
 * Delete all drafts for an account
 */
export async function deleteAllDrafts(accountDid: string): Promise<void> {
  const draftsDir = getDraftsDirectory(accountDid)
  await deleteAsync(draftsDir, {idempotent: true})
}

/**
 * Get the total storage size used by drafts
 */
export async function getDraftsStorageSize(
  accountDid: string,
): Promise<number> {
  const mediaDir = getMediaDirectory(accountDid)
  const info = await getInfoAsync(mediaDir)

  if (!info.exists) {
    return 0
  }

  try {
    const files = await readDirectoryAsync(mediaDir)
    let totalSize = 0

    for (const file of files) {
      const filePath = joinPath(mediaDir, file)
      const fileInfo = await getInfoAsync(filePath)
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size
      }
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
 * Check if a media file exists in local storage
 */
export async function mediaExists(
  accountDid: string,
  localId: string,
): Promise<boolean> {
  const path = getMediaPath(accountDid, localId)
  const info = await getInfoAsync(path)
  return info.exists
}
