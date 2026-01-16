import {useCallback} from 'react'
import {type AppBskyDraftDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {
  composerStateToDraft,
  draftToComposerPosts,
  draftViewToSummary,
  threadgateToUISettings,
} from './api'
import {logger} from './logger'
import {type DraftSummary} from './schema'
import * as storage from './storage'

const DRAFTS_QUERY_KEY = ['drafts']

/**
 * Hook to list all drafts for the current account
 */
export function useDrafts() {
  const agent = useAgent()

  return useQuery<DraftSummary[]>({
    queryKey: DRAFTS_QUERY_KEY,
    queryFn: async () => {
      const res = await agent.app.bsky.draft.getDrafts({})
      return res.data.drafts.map(view =>
        draftViewToSummary(view, path => storage.mediaExists(path)),
      )
    },
  })
}

/**
 * Hook to load a specific draft for editing
 */
export function useLoadDraft() {
  const agent = useAgent()

  return useCallback(
    async (
      draftId: string,
    ): Promise<{
      draft: AppBskyDraftDefs.Draft
      loadedMedia: Map<string, string>
    } | null> => {
      // Fetch the draft from server
      const res = await agent.app.bsky.draft.getDrafts({})
      const draftView = res.data.drafts.find(d => d.id === draftId)

      if (!draftView) {
        return null
      }

      // Load local media files
      const loadedMedia = new Map<string, string>()
      for (const post of draftView.draft.posts) {
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

      return {draft: draftView.draft, loadedMedia}
    },
    [agent],
  )
}

/**
 * Hook to save a draft
 */
export function useSaveDraft() {
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
      if (
        error &&
        typeof error === 'object' &&
        'error' in error &&
        (error as {error: string}).error === 'DraftLimitReached'
      ) {
        logger.error('Draft limit reached', {error})
        // Error will be handled by caller
      }
    },
  })
}

/**
 * Hook to delete a draft
 */
export function useDeleteDraft() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      // First fetch the draft to get media paths for cleanup
      const res = await agent.app.bsky.draft.getDrafts({})
      const draftView = res.data.drafts.find(d => d.id === draftId)

      if (draftView) {
        // Delete local media files
        for (const post of draftView.draft.posts) {
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
      }

      // Delete from server
      await agent.app.bsky.draft.deleteDraft({id: draftId})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: DRAFTS_QUERY_KEY})
    },
  })
}

// Re-export utilities for use in composer
export {draftToComposerPosts, threadgateToUISettings}
