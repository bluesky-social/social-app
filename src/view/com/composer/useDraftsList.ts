import {useCallback, useMemo, useState} from 'react'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {account, type ComposerDraft} from '#/storage'

const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type DraftItem = {
  id: string
  draft: ComposerDraft
}

/**
 * Hook for managing the drafts list.
 * Provides access to all saved drafts and methods to delete them.
 */
export function useDraftsList() {
  const {currentAccount} = useSession()
  const accountDid = currentAccount?.did

  // State to force re-computation of drafts list after modifications
  const [refreshKey, setRefreshKey] = useState(0)

  // Get all drafts, sorted by timestamp (newest first)
  const drafts = useMemo((): DraftItem[] => {
    // refreshKey is used to trigger re-computation after deletions
    const _refresh = refreshKey
    if (!accountDid) return []

    try {
      const allDrafts = account.get([accountDid, 'composerDrafts'])
      if (!allDrafts) return []

      const now = Date.now()
      const items: DraftItem[] = []

      for (const [id, draft] of Object.entries(allDrafts)) {
        // Skip invalid or too old drafts
        if (draft.version !== 1) continue
        if (now - draft.timestamp > MAX_DRAFT_AGE_MS) continue

        items.push({id, draft})
      }

      // Sort by timestamp, newest first
      items.sort((a, b) => b.draft.timestamp - a.draft.timestamp)

      return items
    } catch (e) {
      logger.error('Failed to get drafts list', {error: e})
      return []
    }
  }, [accountDid, refreshKey])

  const draftsCount = drafts.length

  // Delete a specific draft
  const deleteDraft = useCallback(
    (draftId: string) => {
      if (!accountDid) return

      try {
        const allDrafts = account.get([accountDid, 'composerDrafts'])
        if (!allDrafts || !allDrafts[draftId]) return

        const remainingDrafts: Record<string, ComposerDraft> = {}
        for (const [id, draft] of Object.entries(allDrafts)) {
          if (id !== draftId) {
            remainingDrafts[id] = draft
          }
        }

        if (Object.keys(remainingDrafts).length > 0) {
          account.set([accountDid, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([accountDid, 'composerDrafts'])
        }

        // Trigger re-render to update the list
        setRefreshKey(k => k + 1)

        logger.debug('Draft deleted', {draftId})
      } catch (e) {
        logger.error('Failed to delete draft', {error: e, draftId})
      }
    },
    [accountDid],
  )

  // Get a specific draft by ID
  const getDraft = useCallback(
    (draftId: string): ComposerDraft | null => {
      if (!accountDid) return null

      try {
        const allDrafts = account.get([accountDid, 'composerDrafts'])
        if (!allDrafts) return null

        return allDrafts[draftId] ?? null
      } catch (e) {
        logger.error('Failed to get draft', {error: e, draftId})
        return null
      }
    },
    [accountDid],
  )

  // Clean up old drafts
  const cleanupOldDrafts = useCallback(() => {
    if (!accountDid) return

    try {
      const allDrafts = account.get([accountDid, 'composerDrafts'])
      if (!allDrafts) return

      const now = Date.now()
      const remainingDrafts: Record<string, ComposerDraft> = {}
      let removedCount = 0

      for (const [id, draft] of Object.entries(allDrafts)) {
        if (draft.version === 1 && now - draft.timestamp <= MAX_DRAFT_AGE_MS) {
          remainingDrafts[id] = draft
        } else {
          removedCount++
        }
      }

      if (removedCount > 0) {
        if (Object.keys(remainingDrafts).length > 0) {
          account.set([accountDid, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([accountDid, 'composerDrafts'])
        }
        logger.debug('Cleaned up old drafts', {removedCount})
      }
    } catch (e) {
      logger.error('Failed to cleanup old drafts', {error: e})
    }
  }, [accountDid])

  return {
    drafts,
    draftsCount,
    deleteDraft,
    getDraft,
    cleanupOldDrafts,
  }
}
