import {useCallback, useEffect, useState} from 'react'

import {type DraftItem, draftsStorage} from '#/state/drafts'
import {useSession} from '#/state/session'
import {type ComposerDraft} from '#/storage'

// Re-export DraftItem for consumers
export type {DraftItem}

/**
 * Hook for managing the drafts list.
 * Provides access to all saved drafts and methods to delete them.
 */
export function useDraftsList() {
  const {currentAccount} = useSession()
  const accountDid = currentAccount?.did

  // State for drafts list
  const [drafts, setDrafts] = useState<DraftItem[]>([])

  // Load drafts on mount and when accountDid changes
  useEffect(() => {
    if (!accountDid) {
      setDrafts([])
      return
    }

    draftsStorage.getAllDrafts(accountDid).then(setDrafts)
  }, [accountDid])

  const draftsCount = drafts.length

  // Delete a specific draft
  const deleteDraft = useCallback(
    (draftId: string) => {
      if (!accountDid) return

      draftsStorage.deleteDraft(accountDid, draftId).then(() => {
        // Refresh the list after deletion
        draftsStorage.getAllDrafts(accountDid).then(setDrafts)
      })
    },
    [accountDid],
  )

  // Get a specific draft by ID
  const getDraft = useCallback(
    async (draftId: string): Promise<ComposerDraft | null> => {
      if (!accountDid) return null
      return draftsStorage.getDraft(accountDid, draftId)
    },
    [accountDid],
  )

  // Clean up old drafts
  const cleanupOldDrafts = useCallback(() => {
    if (!accountDid) return

    draftsStorage.cleanupOldDrafts(accountDid).then(removedCount => {
      if (removedCount > 0) {
        // Refresh the list after cleanup
        draftsStorage.getAllDrafts(accountDid).then(setDrafts)
      }
    })
  }, [accountDid])

  // Refresh the drafts list (useful after saving a new draft)
  const refreshDrafts = useCallback(() => {
    if (!accountDid) return

    draftsStorage.getAllDrafts(accountDid).then(setDrafts)
  }, [accountDid])

  return {
    drafts,
    draftsCount,
    deleteDraft,
    getDraft,
    cleanupOldDrafts,
    refreshDrafts,
  }
}
