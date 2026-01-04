import {logger} from '#/logger'
import {account, type ComposerDraft} from '#/storage'

const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type DraftItem = {
  id: string
  draft: ComposerDraft
}

/**
 * Storage layer for composer drafts.
 *
 * Currently backed by MMKV (local storage), but uses an async API
 * to support future migration to a server-side KV store.
 *
 * All operations are scoped to a specific account (DID).
 */
export const draftsStorage = {
  /**
   * Get a single draft by ID
   */
  async getDraft(did: string, draftId: string): Promise<ComposerDraft | null> {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts) return null

      const draft = allDrafts[draftId]
      if (!draft) return null

      if (draft.version !== 1) {
        logger.warn('Incompatible draft version', {
          draftId,
          version: draft.version,
        })
        return null
      }

      if (Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
        return null
      }

      return draft
    } catch (e) {
      logger.error('Failed to get draft', {error: e, draftId})
      return null
    }
  },

  /**
   * Get all drafts for an account, sorted by timestamp (newest first)
   */
  async getAllDrafts(did: string): Promise<DraftItem[]> {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts) return []

      const now = Date.now()
      const items: DraftItem[] = []

      for (const [id, draft] of Object.entries(allDrafts)) {
        if (draft.version !== 1) continue
        if (now - draft.timestamp > MAX_DRAFT_AGE_MS) continue
        items.push({id, draft})
      }

      items.sort((a, b) => b.draft.timestamp - a.draft.timestamp)
      return items
    } catch (e) {
      logger.error('Failed to get drafts list', {error: e})
      return []
    }
  },

  /**
   * Save a draft (create or update)
   */
  async saveDraft(
    did: string,
    draftId: string,
    draft: ComposerDraft,
  ): Promise<void> {
    try {
      const allDrafts = account.get([did, 'composerDrafts']) ?? {}
      account.set([did, 'composerDrafts'], {
        ...allDrafts,
        [draftId]: draft,
      })
    } catch (e) {
      logger.error('Failed to save draft', {error: e, draftId})
    }
  },

  /**
   * Delete a single draft
   */
  async deleteDraft(did: string, draftId: string): Promise<void> {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts || !allDrafts[draftId]) return

      const {[draftId]: _deleted, ...remainingDrafts} = allDrafts

      if (Object.keys(remainingDrafts).length > 0) {
        account.set([did, 'composerDrafts'], remainingDrafts)
      } else {
        account.remove([did, 'composerDrafts'])
      }
    } catch (e) {
      logger.error('Failed to delete draft', {error: e, draftId})
    }
  },

  /**
   * Clean up old/invalid drafts, returns count of removed drafts
   */
  async cleanupOldDrafts(did: string): Promise<number> {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts) return 0

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
          account.set([did, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([did, 'composerDrafts'])
        }
      }

      return removedCount
    } catch (e) {
      logger.error('Failed to cleanup old drafts', {error: e})
      return 0
    }
  },
}
