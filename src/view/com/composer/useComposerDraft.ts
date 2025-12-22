import {useCallback, useEffect, useMemo, useRef} from 'react'
import {RichText} from '@atproto/api'

import {type SelfLabel} from '#/lib/moderation'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {account, type ComposerDraft} from '#/storage'
import {type ComposerState} from './state/composer'

const AUTOSAVE_DELAY_MS = 1000 // 1 second debounce
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function removeDraft(
  allDrafts: Record<string, ComposerDraft>,
  draftIdToRemove: string,
): Record<string, ComposerDraft> | null {
  const result: Record<string, ComposerDraft> = {}
  for (const key of Object.keys(allDrafts)) {
    if (key !== draftIdToRemove) {
      result[key] = allDrafts[key]
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

type SerializedImage = {
  alt: string
  path: string
  width: number
  height: number
  mime: string
}

type SerializedVideo = {
  blobRef: unknown // BlobRef from @atproto/api (server reference)
  width: number
  height: number
  mimeType: string
  altText: string
}

type SerializedDraft = ComposerDraft

function serializeDraft(state: ComposerState): SerializedDraft {
  return {
    version: 1,
    timestamp: Date.now(),
    thread: {
      posts: state.thread.posts.map(post => {
        const media = post.embed.media
        let images: SerializedImage[] | undefined
        let gif:
          | {id: string; media_formats: unknown; title: string; alt: string}
          | undefined

        let video: SerializedVideo | undefined

        if (media?.type === 'images') {
          // Serialize images with their local paths
          // Note: These may not be available if the app was closed and cache was cleared
          images = media.images.map(img => ({
            alt: img.alt,
            path: img.source.path,
            width: img.source.width,
            height: img.source.height,
            mime: img.source.mime,
          }))
        } else if (media?.type === 'gif') {
          // GIFs are already references, easy to serialize
          gif = {
            id: media.gif.id,
            media_formats: media.gif.media_formats,
            title: media.gif.title,
            alt: media.alt,
          }
        } else if (media?.type === 'video') {
          logger.debug('Draft: Video found in post', {
            status: media.video.status,
            hasAsset: !!media.video.asset,
            hasPendingPublish: !!(media.video as any).pendingPublish,
          })
          if (media.video.status === 'done') {
            // Only serialize videos that are fully uploaded
            // Don't save the asset.uri - it's local data and can be huge
            // The blobRef is all we need since the video is on the server
            video = {
              blobRef: media.video.pendingPublish.blobRef,
              width: media.video.asset.width,
              height: media.video.asset.height,
              mimeType: media.video.asset.mimeType || 'video/mp4',
              altText: media.video.altText,
            }
            logger.debug('Draft: Serialized video', {
              hasBlobRef: !!video.blobRef,
              dimensions: `${video.width}x${video.height}`,
            })
          } else {
            logger.debug('Draft: Skipping video (not done)', {
              status: media.video.status,
            })
          }
        }
        // Videos in other states (compressing, uploading, processing) are skipped

        return {
          id: post.id,
          text: post.richtext.text,
          labels: post.labels,
          embed: {
            quoteUri: post.embed.quote?.uri,
            linkUri: post.embed.link?.uri,
            images,
            gif,
            video,
          },
        }
      }),
      postgate: state.thread.postgate,
      threadgate: state.thread.threadgate,
    },
    activePostIndex: state.activePostIndex,
  }
}

export function deserializeDraft(
  data: SerializedDraft,
): Partial<ComposerState> {
  return {
    thread: {
      posts: data.thread.posts.map(post => {
        let media:
          | {type: 'images'; images: any[]}
          | {type: 'gif'; gif: any; alt: string}
          | {type: 'video'; video: any}
          | undefined

        // Reconstruct images if available
        if (post.embed.images && post.embed.images.length > 0) {
          media = {
            type: 'images',
            images: post.embed.images.map(img => ({
              alt: img.alt,
              source: {
                id: `restored-${Date.now()}-${Math.random()}`, // Generate new ID
                path: img.path,
                width: img.width,
                height: img.height,
                mime: img.mime,
              },
              // No transformations in restored drafts
            })),
          }
        } else if (post.embed.gif) {
          // Reconstruct GIF
          media = {
            type: 'gif',
            gif: post.embed.gif,
            alt: post.embed.gif.alt,
          }
        } else if (post.embed.video) {
          // Reconstruct video (already uploaded to server)
          logger.debug('Draft: Restoring video from draft', {
            hasVideo: !!post.embed.video,
            hasBlobRef: !!post.embed.video.blobRef,
          })
          const abortController = new AbortController()
          abortController.abort() // Already uploaded, can't resume
          media = {
            type: 'video',
            video: {
              status: 'done',
              progress: 100,
              abortController,
              asset: {
                uri: '', // Placeholder - video is on server, we have the blobRef
                width: post.embed.video.width,
                height: post.embed.video.height,
                mimeType: post.embed.video.mimeType,
              },
              video: {
                uri: '', // Placeholder - not needed for posting
                mimeType: post.embed.video.mimeType,
                size: 0,
              },
              pendingPublish: {
                blobRef: post.embed.video.blobRef,
              },
              altText: post.embed.video.altText,
              captions: [],
            },
          }
        }

        const rt = new RichText({text: post.text})
        return {
          id: post.id,
          richtext: rt,
          shortenedGraphemeLength: rt.graphemeLength,
          labels: post.labels as SelfLabel[],
          embed: {
            quote: post.embed.quoteUri
              ? {type: 'link' as const, uri: post.embed.quoteUri}
              : undefined,
            link: post.embed.linkUri
              ? {type: 'link' as const, uri: post.embed.linkUri}
              : undefined,
            media,
          },
        }
      }),
      // These are already properly typed when saved, cast back to their types
      postgate: data.thread.postgate as any,
      threadgate: data.thread.threadgate as any,
    },
    activePostIndex: data.activePostIndex,
  }
}

/**
 * Hook for managing a single draft in the composer.
 * Auto-saves the draft as the user types, and provides methods to load/clear.
 *
 * @param composerState The current composer state to auto-save
 * @param draftId Optional draft ID to load an existing draft. If not provided, a new ID is generated.
 */
export function useComposerDraft(
  composerState: ComposerState,
  draftId?: string,
) {
  const {currentAccount} = useSession()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  // Generate or use provided draft ID
  const currentDraftId = useMemo(() => draftId || generateDraftId(), [draftId])

  const accountDid = currentAccount?.did

  // Check if draft has any content worth saving
  const hasContent = useCallback((state: ComposerState) => {
    return state.thread.posts.some(
      post =>
        post.richtext.text.trim().length > 0 ||
        post.embed.quote ||
        post.embed.link ||
        post.embed.media,
    )
  }, [])

  // Core save logic (used by both debounced and immediate save)
  const performSave = useCallback(
    (state: ComposerState) => {
      if (!accountDid) return

      try {
        const allDrafts = account.get([accountDid, 'composerDrafts']) ?? {}

        if (hasContent(state)) {
          const serialized = serializeDraft(state)
          logger.debug('Draft serialized successfully', {
            draftId: currentDraftId,
            hasPosts: serialized.thread.posts.length > 0,
            hasVideo: !!serialized.thread.posts[0]?.embed?.video,
          })

          // Update the draft
          account.set([accountDid, 'composerDrafts'], {
            ...allDrafts,
            [currentDraftId]: serialized,
          })

          logger.info('Composer draft saved', {
            draftId: currentDraftId,
            textLength: state.thread.posts[0]?.richtext.text.length || 0,
          })
        } else {
          // If no content, remove this draft
          if (allDrafts[currentDraftId]) {
            const remainingDrafts = removeDraft(allDrafts, currentDraftId)
            if (remainingDrafts) {
              account.set([accountDid, 'composerDrafts'], remainingDrafts)
            } else {
              account.remove([accountDid, 'composerDrafts'])
            }
            logger.debug('Empty draft removed', {draftId: currentDraftId})
          }
        }
      } catch (e) {
        logger.error('Failed to save composer draft', {
          error: e,
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
        })
      }
    },
    [accountDid, currentDraftId, hasContent],
  )

  // Save draft to storage (debounced)
  const saveDraft = useCallback(
    (state: ComposerState) => {
      if (!accountDid) return

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce the save
      saveTimeoutRef.current = setTimeout(() => {
        performSave(state)
      }, AUTOSAVE_DELAY_MS)
    },
    [accountDid, performSave],
  )

  // Save draft immediately (bypasses debounce)
  const saveImmediate = useCallback(
    (state: ComposerState) => {
      // Clear any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      performSave(state)
    },
    [performSave],
  )

  // Load draft from storage
  const loadDraft = useCallback((): Partial<ComposerState> | null => {
    if (!accountDid || !draftId) return null

    try {
      const allDrafts = account.get([accountDid, 'composerDrafts'])
      if (!allDrafts) return null

      const draft = allDrafts[draftId]
      if (!draft) return null

      // Check version compatibility
      if (draft.version !== 1) {
        logger.warn('Incompatible draft version, discarding', {
          version: draft.version,
        })
        const remainingDrafts = removeDraft(allDrafts, draftId)
        if (remainingDrafts) {
          account.set([accountDid, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([accountDid, 'composerDrafts'])
        }
        return null
      }

      // Check if draft is too old
      const age = Date.now() - draft.timestamp
      if (age > MAX_DRAFT_AGE_MS) {
        logger.debug('Draft too old, discarding', {age})
        const remainingDrafts = removeDraft(allDrafts, draftId)
        if (remainingDrafts) {
          account.set([accountDid, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([accountDid, 'composerDrafts'])
        }
        return null
      }

      logger.info('Composer draft loaded', {
        draftId,
        textLength: draft.thread.posts[0]?.text.length || 0,
      })
      return deserializeDraft(draft)
    } catch (e) {
      logger.error('Failed to load composer draft', {error: e})
      return null
    }
  }, [accountDid, draftId])

  // Clear draft from storage
  const clearDraft = useCallback(() => {
    if (!accountDid) return

    try {
      const allDrafts = account.get([accountDid, 'composerDrafts'])
      if (allDrafts && allDrafts[currentDraftId]) {
        const remainingDrafts = removeDraft(allDrafts, currentDraftId)
        if (remainingDrafts) {
          account.set([accountDid, 'composerDrafts'], remainingDrafts)
        } else {
          account.remove([accountDid, 'composerDrafts'])
        }
        logger.debug('Composer draft cleared', {draftId: currentDraftId})
      }
    } catch (e) {
      logger.error('Failed to clear composer draft', {error: e})
    }
  }, [accountDid, currentDraftId])

  // Auto-save on state changes (only for new drafts, not when editing existing ones)
  // For existing drafts, we only save on explicit user action (Update button)
  const isExisting = !!draftId
  useEffect(() => {
    if (!isExisting) {
      saveDraft(composerState)
    }
  }, [composerState, saveDraft, isExisting])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    draftId: currentDraftId,
    loadDraft,
    clearDraft,
    saveImmediate,
    isExistingDraft: !!draftId,
  }
}
