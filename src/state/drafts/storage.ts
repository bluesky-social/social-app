import {logger} from '#/logger'
import {account, type ComposerDraft} from '#/storage'

const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type DraftItem = {
  id: string
  draft: ComposerDraft
}

/**
 * Abstraction layer for draft storage operations.
 *
 * Currently backed by MMKV (local storage), but designed with an async API
 * to make future migration to a backend key-value store easier.
 *
 * All operations are scoped to a specific account (DID).
 *
 * Note: Sync methods (*Sync) are provided for cases where async isn't possible
 * (e.g., React initial state). When migrating to a backend, these will need
 * to be refactored to use async patterns (loading states, suspense, etc.).
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

      // Validate version and age
      if (draft.version !== 1) {
        logger.warn('Incompatible draft version', {
          draftId,
          version: draft.version,
        })
        return null
      }

      if (Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
        logger.debug('Draft too old', {draftId})
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
      logger.debug('Draft saved', {draftId})
    } catch (e) {
      logger.error('Failed to save draft', {error: e, draftId})
      throw e
    }
  },

  /**
   * Delete a single draft
   */
  async deleteDraft(did: string, draftId: string): Promise<void> {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts || !allDrafts[draftId]) return

      const remainingDrafts: Record<string, ComposerDraft> = {}
      for (const [id, draft] of Object.entries(allDrafts)) {
        if (id !== draftId) {
          remainingDrafts[id] = draft
        }
      }

      if (Object.keys(remainingDrafts).length > 0) {
        account.set([did, 'composerDrafts'], remainingDrafts)
      } else {
        account.remove([did, 'composerDrafts'])
      }

      logger.debug('Draft deleted', {draftId})
    } catch (e) {
      logger.error('Failed to delete draft', {error: e, draftId})
      throw e
    }
  },

  /**
   * Check if a draft exists
   */
  async hasDraft(did: string, draftId: string): Promise<boolean> {
    const draft = await this.getDraft(did, draftId)
    return draft !== null
  },

  /**
   * Get count of valid drafts
   */
  async getDraftsCount(did: string): Promise<number> {
    const drafts = await this.getAllDrafts(did)
    return drafts.length
  },

  /**
   * Clean up old/invalid drafts
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
        logger.debug('Cleaned up old drafts', {removedCount})
      }

      return removedCount
    } catch (e) {
      logger.error('Failed to cleanup old drafts', {error: e})
      return 0
    }
  },

  // ============================================
  // Synchronous methods (for use in contexts where async isn't possible)
  // These will need refactoring when migrating to a backend store
  // ============================================

  /**
   * Get a single draft by ID (synchronous)
   * Use this only when async isn't possible (e.g., React initial state)
   */
  getDraftSync(did: string, draftId: string): ComposerDraft | null {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
      if (!allDrafts) return null

      const draft = allDrafts[draftId]
      if (!draft) return null

      // Validate version and age
      if (draft.version !== 1) {
        logger.warn('Incompatible draft version', {
          draftId,
          version: draft.version,
        })
        return null
      }

      if (Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
        logger.debug('Draft too old', {draftId})
        return null
      }

      return draft
    } catch (e) {
      logger.error('Failed to get draft (sync)', {error: e, draftId})
      return null
    }
  },

  /**
   * Get all drafts for an account (synchronous)
   * Use this only when async isn't possible
   */
  getAllDraftsSync(did: string): DraftItem[] {
    try {
      const allDrafts = account.get([did, 'composerDrafts'])
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
      logger.error('Failed to get drafts list (sync)', {error: e})
      return []
    }
  },
}
