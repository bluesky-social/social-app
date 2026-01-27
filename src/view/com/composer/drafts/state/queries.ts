import {AppBskyDraftCreateDraft, type AppBskyDraftDefs} from '@atproto/api'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {useAgent} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {composerStateToDraft, draftViewToSummary} from './api'
import {logger} from './logger'
import * as storage from './storage'

const DRAFTS_QUERY_KEY = ['drafts']

/**
 * Hook to list all drafts for the current account
 */
export function useDraftsQuery() {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: DRAFTS_QUERY_KEY,
    queryFn: async ({pageParam}) => {
      // Ensure media cache is populated before checking which media exists
      await storage.ensureMediaCachePopulated()
      const res = await agent.app.bsky.draft.getDrafts({cursor: pageParam})
      return {
        cursor: res.data.cursor,
        drafts: res.data.drafts.map(view =>
          draftViewToSummary(view, path => storage.mediaExists(path)),
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
export async function loadDraft(draft: AppBskyDraftDefs.Draft): Promise<{
  loadedMedia: Map<string, string>
}> {
  // Load local media files
  const loadedMedia = new Map<string, string>()
  for (const post of draft.posts) {
    // Load images
    if (post.embedImages) {
      for (const img of post.embedImages) {
        try {
          const url = await storage.loadMediaFromLocal(img.localRef.path)
          loadedMedia.set(img.localRef.path, url)
        } catch (e) {
          logger.warn('Failed to load draft image', {
            path: img.localRef.path,
            error: e,
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
        } catch (e) {
          logger.warn('Failed to load draft video', {
            path: vid.localRef.path,
            error: e,
          })
        }
      }
    }
  }

  return {loadedMedia}
}

/**
 * Hook to save a draft
 */
export function useSaveDraftMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      composerState,
      existingDraftId,
    }: {
      composerState: ComposerState
      existingDraftId?: string
    }): Promise<string> => {
      // Convert composer state to server draft format
      const {draft, localRefPaths} = composerStateToDraft(composerState)

      // Save media files locally
      for (const [localRefPath, sourcePath] of localRefPaths) {
        // Check if this media is already saved (re-saving existing draft)
        if (!storage.mediaExists(localRefPath)) {
          await storage.saveMediaToLocal(localRefPath, sourcePath)
        }
      }

      if (existingDraftId) {
        // Update existing draft
        await agent.app.bsky.draft.updateDraft({
          draft: {
            id: existingDraftId,
            draft,
          },
        })
        return existingDraftId
      } else {
        // Create new draft
        const res = await agent.app.bsky.draft.createDraft({draft})
        return res.data.id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: DRAFTS_QUERY_KEY})
    },
    onError: error => {
      // Check for draft limit error
      if (error instanceof AppBskyDraftCreateDraft.DraftLimitReachedError) {
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
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      draftId,
    }: {
      draftId: string
      draft: AppBskyDraftDefs.Draft
    }) => {
      // Delete from server first - if this fails, we keep local media for retry
      await agent.app.bsky.draft.deleteDraft({id: draftId})
    },
    onSuccess: async (_, {draft}) => {
      // Only delete local media after server deletion succeeds
      for (const post of draft.posts) {
        if (post.embedImages) {
          for (const img of post.embedImages) {
            await storage.deleteMediaFromLocal(img.localRef.path)
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
