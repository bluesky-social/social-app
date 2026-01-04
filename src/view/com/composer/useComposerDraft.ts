import {useCallback, useMemo} from 'react'

import {draftsStorage, serializeDraft} from '#/state/drafts'
import {useSession} from '#/state/session'
import {type ComposerState} from './state/composer'

function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Hook for managing a single draft in the composer.
 * Provides methods to save and clear drafts.
 *
 * @param draftId Optional draft ID for an existing draft. If not provided, a new ID is generated.
 */
export function useComposerDraft(draftId?: string) {
  const {currentAccount} = useSession()
  const accountDid = currentAccount?.did

  const currentDraftId = useMemo(() => draftId || generateDraftId(), [draftId])

  const saveDraft = useCallback(
    (state: ComposerState) => {
      if (!accountDid) return

      const hasContent = state.thread.posts.some(
        post =>
          post.richtext.text.trim().length > 0 ||
          post.embed.quote ||
          post.embed.link ||
          post.embed.media,
      )

      if (hasContent) {
        draftsStorage.saveDraft(
          accountDid,
          currentDraftId,
          serializeDraft(state),
        )
      } else {
        draftsStorage.deleteDraft(accountDid, currentDraftId)
      }
    },
    [accountDid, currentDraftId],
  )

  const clearDraft = useCallback(() => {
    if (!accountDid) return
    draftsStorage.deleteDraft(accountDid, currentDraftId)
  }, [accountDid, currentDraftId])

  return {
    draftId: currentDraftId,
    saveDraft,
    clearDraft,
    isExistingDraft: !!draftId,
  }
}
