import {useCallback, useEffect, useRef} from 'react'
import {RichText} from '@atproto/api'

import {type SelfLabel} from '#/lib/moderation'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {type ComposerState} from './state/composer'

const DRAFT_KEY_PREFIX = 'composer-draft'
const AUTOSAVE_DELAY_MS = 1000 // 1 second debounce

type SerializedImage = {
  alt: string
  path: string
  width: number
  height: number
  mime: string
}

type SerializedDraft = {
  version: 1
  timestamp: number
  thread: {
    posts: Array<{
      id: string
      text: string
      labels: SelfLabel[]
      embed: {
        quoteUri?: string
        linkUri?: string
        // Media
        images?: SerializedImage[]
        gif?: {
          id: string
          media_formats: any
          title: string
          alt: string
        }
        // Note: Videos are complex with compression/upload state
        // For now we skip videos in drafts
      }
    }>
    postgate: any
    threadgate: any
  }
  activePostIndex: number
}

function getDraftKey(accountDid: string, context: string = 'default'): string {
  return `${DRAFT_KEY_PREFIX}:${accountDid}:${context}`
}

function serializeDraft(state: ComposerState): SerializedDraft {
  return {
    version: 1,
    timestamp: Date.now(),
    thread: {
      posts: state.thread.posts.map(post => {
        const media = post.embed.media
        let images: SerializedImage[] | undefined
        let gif:
          | {id: string; media_formats: any; title: string; alt: string}
          | undefined

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
        }
        // Videos are skipped for now due to complexity

        return {
          id: post.id,
          text: post.richtext.text,
          labels: post.labels,
          embed: {
            quoteUri: post.embed.quote?.uri,
            linkUri: post.embed.link?.uri,
            images,
            gif,
          },
        }
      }),
      postgate: state.thread.postgate,
      threadgate: state.thread.threadgate,
    },
    activePostIndex: state.activePostIndex,
  }
}

function deserializeDraft(data: SerializedDraft): Partial<ComposerState> {
  return {
    thread: {
      posts: data.thread.posts.map(post => {
        let media:
          | {type: 'images'; images: any[]}
          | {type: 'gif'; gif: any; alt: string}
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
        }

        return {
          id: post.id,
          richtext: new RichText({text: post.text}),
          shortenedGraphemeLength: post.text.length, // Will be recalculated
          labels: post.labels,
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
      postgate: data.thread.postgate,
      threadgate: data.thread.threadgate,
    },
    activePostIndex: data.activePostIndex,
  }
}

export function useComposerDraft(
  composerState: ComposerState,
  context: string = 'default',
) {
  const {currentAccount} = useSession()
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const draftKey = currentAccount
    ? getDraftKey(currentAccount.did, context)
    : null

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

  // Save draft to localStorage (debounced)
  const saveDraft = useCallback(
    (state: ComposerState) => {
      if (!isWeb || !draftKey) return

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce the save
      saveTimeoutRef.current = setTimeout(() => {
        try {
          if (hasContent(state)) {
            const serialized = serializeDraft(state)
            localStorage.setItem(draftKey, JSON.stringify(serialized))
            logger.info('Composer draft saved', {
              key: draftKey,
              textLength: state.thread.posts[0]?.richtext.text.length || 0,
            })
          } else {
            // If no content, remove any existing draft
            localStorage.removeItem(draftKey)
            logger.debug('Empty draft removed', {key: draftKey})
          }
        } catch (e) {
          logger.error('Failed to save composer draft', {error: e})
        }
      }, AUTOSAVE_DELAY_MS)
    },
    [draftKey, hasContent],
  )

  // Load draft from localStorage
  const loadDraft = useCallback((): Partial<ComposerState> | null => {
    if (!isWeb || !draftKey) return null

    try {
      const stored = localStorage.getItem(draftKey)
      if (!stored) return null

      const parsed: SerializedDraft = JSON.parse(stored)

      // Check version compatibility
      if (parsed.version !== 1) {
        logger.warn('Incompatible draft version, discarding', {
          version: parsed.version,
        })
        localStorage.removeItem(draftKey)
        return null
      }

      // Check if draft is too old (e.g., more than 7 days)
      const age = Date.now() - parsed.timestamp
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days
      if (age > MAX_AGE) {
        logger.debug('Draft too old, discarding', {age})
        localStorage.removeItem(draftKey)
        return null
      }

      logger.info('Composer draft loaded', {
        key: draftKey,
        textLength: parsed.thread.posts[0]?.text.length || 0,
      })
      return deserializeDraft(parsed)
    } catch (e) {
      logger.error('Failed to load composer draft', {error: e})
      // Remove corrupted draft
      try {
        localStorage.removeItem(draftKey)
      } catch {}
      return null
    }
  }, [draftKey])

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!isWeb || !draftKey) return

    try {
      localStorage.removeItem(draftKey)
      logger.debug('Composer draft cleared', {key: draftKey})
    } catch (e) {
      logger.error('Failed to clear composer draft', {error: e})
    }
  }, [draftKey])

  // Auto-save on state changes
  useEffect(() => {
    saveDraft(composerState)
  }, [composerState, saveDraft])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const checkHasStoredDraft = useCallback(() => {
    if (!isWeb || !draftKey) return false
    try {
      return localStorage.getItem(draftKey) !== null
    } catch {
      return false
    }
  }, [draftKey])

  return {
    loadDraft,
    clearDraft,
    hasStoredDraft: checkHasStoredDraft,
  }
}
