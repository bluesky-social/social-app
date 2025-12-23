import {useCallback, useEffect, useMemo, useRef} from 'react'
import {RichText} from '@atproto/api'

import {type SelfLabel} from '#/lib/moderation'
import {logger} from '#/logger'
import {draftsStorage} from '#/state/drafts'
import {useSession} from '#/state/session'
import {type ComposerDraft} from '#/storage'
import {type ComposerState} from './state/composer'

const AUTOSAVE_DELAY_MS = 1000 // 1 second debounce

function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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

      if (hasContent(state)) {
        const serialized = serializeDraft(state)
        logger.debug('Draft serialized successfully', {
          draftId: currentDraftId,
          hasPosts: serialized.thread.posts.length > 0,
          hasVideo: !!serialized.thread.posts[0]?.embed?.video,
        })

        draftsStorage.saveDraft(accountDid, currentDraftId, serialized).then(
          () => {
            logger.info('Composer draft saved', {
              draftId: currentDraftId,
              textLength: state.thread.posts[0]?.richtext.text.length || 0,
            })
          },
          e => {
            logger.error('Failed to save composer draft', {
              error: e,
              message: e instanceof Error ? e.message : String(e),
            })
          },
        )
      } else {
        // If no content, remove this draft
        draftsStorage.deleteDraft(accountDid, currentDraftId).then(
          () => {
            logger.debug('Empty draft removed', {draftId: currentDraftId})
          },
          e => {
            logger.error('Failed to remove empty draft', {error: e})
          },
        )
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

    // Note: This is synchronous for now since MMKV is sync underneath.
    // When migrating to a backend, this will need to become async.
    // For now, we call the async function but don't await it in this sync context.
    // The actual loading happens in Composer.tsx via a useEffect.
    let result: Partial<ComposerState> | null = null

    // We need a sync return here for the current implementation
    // This is a known limitation that will need refactoring when migrating to backend
    draftsStorage.getDraft(accountDid, draftId).then(
      draft => {
        if (draft) {
          logger.info('Composer draft loaded', {
            draftId,
            textLength: draft.thread.posts[0]?.text.length || 0,
          })
          result = deserializeDraft(draft)
        }
      },
      e => {
        logger.error('Failed to load composer draft', {error: e})
      },
    )

    // Since MMKV is actually sync, the promise resolves immediately
    // This works for now but should be refactored for async backends
    return result
  }, [accountDid, draftId])

  // Clear draft from storage
  const clearDraft = useCallback(() => {
    if (!accountDid) return

    draftsStorage.deleteDraft(accountDid, currentDraftId).then(
      () => {
        logger.debug('Composer draft cleared', {draftId: currentDraftId})
      },
      e => {
        logger.error('Failed to clear composer draft', {error: e})
      },
    )
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
