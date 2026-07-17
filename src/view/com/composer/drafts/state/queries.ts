import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {isXrpcErrorOf} from '#/lib/xrpc-error'
import {useAppviewClient} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {useAnalytics} from '#/analytics'
import {getDeviceId} from '#/analytics/identifiers'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {composerStateToDraft, draftViewToSummary} from './api'
import {logger} from './logger'
import * as storage from './storage'

const DRAFTS_QUERY_KEY = ['drafts']

/**
 * Hook to list all drafts for the current account
 */
export function useDraftsQuery() {
  const client = useAppviewClient()
  const ax = useAnalytics()

  return useInfiniteQuery({
    queryKey: DRAFTS_QUERY_KEY,
    queryFn: async ({pageParam}) => {
      // Ensure media cache is populated before checking which media exists
      await storage.ensureMediaCachePopulated()
      const res = await client.call(app.bsky.draft.getDrafts, {
        cursor: pageParam,
      })
      return {
        cursor: res.cursor,
        drafts: res.drafts.map(view =>
          draftViewToSummary({
            view,
            analytics: ax,
          }),
        ),
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor || undefined,
  })
}

/**
 * Load a draft's local media for editing.
 * Takes the full Draft object (from DraftSummary) to avoid re-fetching.
 */
export async function loadDraftMedia(
  draft: app.bsky.draft.defs.Draft,
): Promise<{
  loadedMedia: Map<string, string>
}> {
  // Load local media files
  const loadedMedia = new Map<string, string>()

  // can't load media from another device
  if (draft.deviceId && draft.deviceId !== getDeviceId()) {
    return {loadedMedia}
  }

  for (const post of draft.posts) {
    // Load images
    if (post.embedImages) {
      for (const img of post.embedImages) {
        try {
          const url = await storage.loadMediaFromLocal(img.localRef.path)
          loadedMedia.set(img.localRef.path, url)
        } catch (e: any) {
          logger.error('Failed to load draft image', {
            path: img.localRef.path,
            safeMessage: e.message,
          })
        }
      }
    }
    // Load gallery
    if (post.embedGallery) {
      for (const item of post.embedGallery.items) {
        if (!bsky.isType(app.bsky.draft.defs.draftEmbedImage, item)) continue
        try {
          const url = await storage.loadMediaFromLocal(item.localRef.path)
          loadedMedia.set(item.localRef.path, url)
        } catch (e) {
          logger.error('Failed to load draft gallery image', {
            path: item.localRef.path,
            safeMessage: e instanceof Error ? e.message : String(e),
          })
        }
      }
    }
    // Load videos
    if (post.embedVideos) {
      for (const vid of post.embedVideos) {
        try {
          const url = await storage.loadMediaFromLocal(vid.localRef.path)
          loadedMedia.set(vid.localRef.path, url)
        } catch (e: any) {
          logger.error('Failed to load draft video', {
            path: vid.localRef.path,
            safeMessage: e.message,
          })
        }
      }
    }
  }

  return {loadedMedia}
}

/**
 * Hook to save a draft.
 *
 * IMPORTANT: Network operations happen first in mutationFn.
 * Local storage operations (save new media, delete orphaned media) happen in onSuccess.
 * This ensures we don't lose data if the network request fails.
 */
export function useSaveDraftMutation() {
  const client = useAppviewClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      composerState,
      existingDraftId,
    }: {
      composerState: ComposerState
      existingDraftId?: string
    }): Promise<{
      draftId: string
      localRefPaths: Map<string, string>
      originalLocalRefs: Set<string> | undefined
    }> => {
      // Convert composer state to server draft format
      const {draft, localRefPaths} = await composerStateToDraft(composerState)

      logger.debug('saving draft', {
        existingDraftId,
        localRefPathCount: localRefPaths.size,
        originalLocalRefCount: composerState.originalLocalRefs?.size ?? 0,
      })

      // 1. NETWORK FIRST - Update/create server draft
      let draftId: string
      if (existingDraftId) {
        // Update existing draft
        logger.debug('updating existing draft on server', {
          draftId: existingDraftId,
        })
        await client.call(app.bsky.draft.updateDraft, {
          draft: {
            id: existingDraftId,
            draft,
          },
        })
        draftId = existingDraftId
      } else {
        // Create new draft
        logger.debug('creating new draft on server')
        const res = await client.call(app.bsky.draft.createDraft, {draft})
        draftId = res.id
        logger.debug('created new draft', {draftId})
      }

      // Return data needed for onSuccess
      return {
        draftId,
        localRefPaths,
        originalLocalRefs: composerState.originalLocalRefs,
      }
    },
    onSuccess: async ({draftId, localRefPaths, originalLocalRefs}) => {
      // 2. LOCAL STORAGE ONLY AFTER NETWORK SUCCEEDS
      logger.debug('network save succeeded, processing local storage', {
        draftId,
      })

      // Save new/changed media files
      for (const [localRefPath, sourcePath] of localRefPaths) {
        // Only save if this media doesn't already exist (reusing localRefPath)
        if (!storage.mediaExists(localRefPath)) {
          logger.debug('saving new media file', {localRefPath})
          await storage.saveMediaToLocal(localRefPath, sourcePath)
        } else {
          logger.debug('skipping existing media file', {localRefPath})
        }
      }

      // Delete orphaned media (old refs not in new)
      if (originalLocalRefs) {
        const newLocalRefs = new Set(localRefPaths.keys())
        for (const oldRef of originalLocalRefs) {
          if (!newLocalRefs.has(oldRef)) {
            logger.debug('deleting orphaned media file', {
              localRefPath: oldRef,
            })
            await storage.deleteMediaFromLocal(oldRef)
          }
        }
      }

      await queryClient.invalidateQueries({queryKey: DRAFTS_QUERY_KEY})
    },
    onError: error => {
      // Check for draft limit error
      if (
        isXrpcErrorOf(app.bsky.draft.createDraft, error, 'DraftLimitReached')
      ) {
        logger.error('Draft limit reached', {safeMessage: error.message})
        // Error will be handled by caller
      } else if (!isNetworkError(error)) {
        logger.error('Could not create draft (reason unknown)', {
          safeMessage: error.message,
        })
      }
    },
  })
}

/**
 * Hook to delete a draft.
 * Takes the full draft data to avoid re-fetching for media cleanup.
 */
export function useDeleteDraftMutation() {
  const client = useAppviewClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      draftId,
    }: {
      draftId: string
      draft: app.bsky.draft.defs.Draft
    }) => {
      // Delete from server first - if this fails, we keep local media for retry
      await client.call(app.bsky.draft.deleteDraft, {id: draftId})
    },
    onSuccess: async (_, {draft}) => {
      // Only delete local media after server deletion succeeds
      for (const post of draft.posts) {
        if (post.embedImages) {
          for (const img of post.embedImages) {
            await storage.deleteMediaFromLocal(img.localRef.path)
          }
        }
        if (post.embedGallery) {
          for (const item of post.embedGallery.items) {
            if (!bsky.isType(app.bsky.draft.defs.draftEmbedImage, item))
              continue
            await storage.deleteMediaFromLocal(item.localRef.path)
          }
        }
        if (post.embedVideos) {
          for (const vid of post.embedVideos) {
            await storage.deleteMediaFromLocal(vid.localRef.path)
          }
        }
      }
      queryClient.invalidateQueries({queryKey: DRAFTS_QUERY_KEY})
    },
  })
}

/**
 * Hook to clean up a draft after it has been published.
 * Deletes the draft from server and all associated local media.
 * Takes draftId and originalLocalRefs from composer state.
 */
export function useCleanupPublishedDraftMutation() {
  const client = useAppviewClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      draftId,
      originalLocalRefs,
    }: {
      draftId: string
      originalLocalRefs: Set<string>
    }) => {
      logger.debug('cleaning up published draft', {
        draftId,
        mediaFileCount: originalLocalRefs.size,
      })
      // Delete from server first
      await client.call(app.bsky.draft.deleteDraft, {id: draftId})
      logger.debug('deleted draft from server', {draftId})
    },
    onSuccess: async (_, {originalLocalRefs}) => {
      // Delete all local media files for this draft
      for (const localRef of originalLocalRefs) {
        logger.debug('deleting media file after publish', {
          localRefPath: localRef,
        })
        await storage.deleteMediaFromLocal(localRef)
      }
      queryClient.invalidateQueries({queryKey: DRAFTS_QUERY_KEY})
      logger.debug('cleanup after publish complete')
    },
    onError: error => {
      // Log but don't throw - the post was already published successfully
      logger.warn('Failed to clean up published draft', {
        safeMessage: error instanceof Error ? error.message : String(error),
      })
    },
  })
}
