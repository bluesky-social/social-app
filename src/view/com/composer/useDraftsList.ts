import {useCallback, useEffect, useState} from 'react'

import {type DraftItem, draftsStorage} from '#/state/drafts'
import {useSession} from '#/state/session'

export type {DraftItem}

/**
 * Hook for managing the drafts list.
 * Provides access to all saved drafts and methods to manage them.
 */
export function useDraftsList() {
  const {currentAccount} = useSession()
  const accountDid = currentAccount?.did

  const [drafts, setDrafts] = useState<DraftItem[]>([])

  useEffect(() => {
    if (!accountDid) {
      setDrafts([])
      return
    }
    draftsStorage.getAllDrafts(accountDid).then(setDrafts)
  }, [accountDid])

  const deleteDraft = useCallback(
    async (draftId: string) => {
      if (!accountDid) return
      await draftsStorage.deleteDraft(accountDid, draftId)
      const updated = await draftsStorage.getAllDrafts(accountDid)
      setDrafts(updated)
    },
    [accountDid],
  )

  const cleanupOldDrafts = useCallback(async () => {
    if (!accountDid) return
    const removedCount = await draftsStorage.cleanupOldDrafts(accountDid)
    if (removedCount > 0) {
      const updated = await draftsStorage.getAllDrafts(accountDid)
      setDrafts(updated)
    }
  }, [accountDid])

  const refreshDrafts = useCallback(async () => {
    if (!accountDid) return
    const updated = await draftsStorage.getAllDrafts(accountDid)
    setDrafts(updated)
  }, [accountDid])

  return {
    drafts,
    draftsCount: drafts.length,
    deleteDraft,
    cleanupOldDrafts,
    refreshDrafts,
  }
}
