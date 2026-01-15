import {useCallback} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import {type ComposerImage} from '#/state/gallery'
import {useSession} from '#/state/session'
import {type ComposerOpts} from '#/state/shell/composer'
import {
  type ComposerState,
  type PostDraft,
} from '#/view/com/composer/state/composer'
import {type VideoState} from '#/view/com/composer/state/video'
import {
  type DraftSummary,
  type LocalMediaRef,
  type StoredDraft,
  type StoredGif,
  type StoredPostDraft,
  type StoredRichText,
} from './schema'
import * as storage from './storage'

const DRAFTS_QUERY_KEY_ROOT = 'drafts'

export function draftsQueryKey(did: string) {
  return [DRAFTS_QUERY_KEY_ROOT, did]
}

/**
 * Hook to list all drafts for the current account
 */
export function useDrafts() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  return useQuery<DraftSummary[]>({
    queryKey: draftsQueryKey(did || ''),
    queryFn: async () => {
      if (!did) return []
      return storage.listDrafts(did)
    },
    enabled: Boolean(did),
  })
}

/**
 * Hook to load a specific draft
 */
export function useLoadDraft() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  return useCallback(
    async (draftId: string): Promise<StoredDraft | null> => {
      if (!did) return null
      return storage.loadDraftMeta(did, draftId)
    },
    [did],
  )
}

/**
 * Hook to save a draft
 */
export function useSaveDraft() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      composerState,
      replyTo,
      existingDraftId,
      loadedMediaMap,
    }: {
      composerState: ComposerState
      replyTo?: ComposerOpts['replyTo']
      existingDraftId?: string
      loadedMediaMap?: Map<string, string> // localId -> path/url
    }): Promise<StoredDraft> => {
      if (!did) {
        throw new Error('No account')
      }

      const now = new Date().toISOString()
      const draftId = existingDraftId || nanoid()

      // Build a reverse map (path -> localId) for identifying reusable media
      const pathToLocalId = new Map<string, string>()
      if (loadedMediaMap) {
        for (const [localId, path] of loadedMediaMap) {
          pathToLocalId.set(path, localId)
        }
      }

      // Collect old media localIds for cleanup
      let oldMediaLocalIds: Set<string> = new Set()
      if (existingDraftId) {
        const existingDraft = await storage.loadDraftMeta(did, existingDraftId)
        if (existingDraft) {
          oldMediaLocalIds = collectMediaLocalIds(existingDraft)
        }
      }

      // Serialize the composer state, tracking which localIds are reused
      const reusedLocalIds = new Set<string>()
      const posts: StoredPostDraft[] = []

      for (const post of composerState.thread.posts) {
        const storedPost = await serializePost(
          did,
          post,
          pathToLocalId,
          reusedLocalIds,
        )
        posts.push(storedPost)
      }

      // Clean up old media that wasn't reused
      for (const oldLocalId of oldMediaLocalIds) {
        if (!reusedLocalIds.has(oldLocalId)) {
          await storage.deleteMediaFromLocal(did, oldLocalId)
        }
      }

      const draft: StoredDraft = {
        id: draftId,
        accountDid: did,
        createdAt: existingDraftId
          ? (await storage.loadDraftMeta(did, existingDraftId))?.createdAt ||
            now
          : now,
        updatedAt: now,
        replyToUri: replyTo?.uri,
        replyToAuthor: replyTo?.author
          ? {
              did: replyTo.author.did,
              handle: replyTo.author.handle,
              displayName: replyTo.author.displayName,
            }
          : undefined,
        posts,
        postgate: composerState.thread.postgate,
        threadgate: composerState.thread.threadgate,
        syncStatus: 'local',
      }

      // Save the draft
      await storage.saveDraftMeta(did, draft)

      return draft
    },
    onSuccess: () => {
      if (did) {
        queryClient.invalidateQueries({queryKey: draftsQueryKey(did)})
      }
    },
  })
}

/**
 * Hook to delete a draft
 */
export function useDeleteDraft() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      if (!did) {
        throw new Error('No account')
      }
      await storage.deleteDraft(did, draftId)
    },
    onSuccess: () => {
      if (did) {
        queryClient.invalidateQueries({queryKey: draftsQueryKey(did)})
      }
    },
  })
}

/**
 * Collect all media localIds from a draft
 */
function collectMediaLocalIds(draft: StoredDraft): Set<string> {
  const localIds = new Set<string>()
  for (const post of draft.posts) {
    if (post.images) {
      for (const image of post.images) {
        localIds.add(image.localId)
      }
    }
    if (post.video) {
      localIds.add(post.video.localId)
    }
  }
  return localIds
}

/**
 * Serialize a post for storage
 */
async function serializePost(
  accountDid: string,
  post: PostDraft,
  pathToLocalId: Map<string, string>,
  reusedLocalIds: Set<string>,
): Promise<StoredPostDraft> {
  const richtext: StoredRichText = {
    text: post.richtext.text,
    facets: post.richtext.facets,
  }

  const storedPost: StoredPostDraft = {
    id: post.id,
    richtext,
    labels: post.labels,
    quoteUri: post.embed.quote?.uri,
    linkUri: post.embed.link?.uri,
  }

  // Serialize media
  if (post.embed.media) {
    if (post.embed.media.type === 'images') {
      storedPost.images = await serializeImages(
        accountDid,
        post.embed.media.images,
        pathToLocalId,
        reusedLocalIds,
      )
    } else if (post.embed.media.type === 'video') {
      storedPost.video = await serializeVideo(
        accountDid,
        post.embed.media.video,
        pathToLocalId,
        reusedLocalIds,
      )
    } else if (post.embed.media.type === 'gif') {
      storedPost.gif = serializeGif(post.embed.media)
    }
  }

  return storedPost
}

/**
 * Serialize images for storage
 */
async function serializeImages(
  accountDid: string,
  images: ComposerImage[],
  pathToLocalId: Map<string, string>,
  reusedLocalIds: Set<string>,
): Promise<LocalMediaRef[]> {
  const refs: LocalMediaRef[] = []

  for (const image of images) {
    const path = image.transformed?.path || image.source.path

    // Check if this image is already in drafts storage
    // First try the pathToLocalId map (works for both native and web)
    let existingLocalId: string | null | undefined = pathToLocalId.get(path)

    // On native, also check if the path is in the media directory
    if (!existingLocalId) {
      existingLocalId = storage.extractLocalIdFromPath(accountDid, path)
    }

    let localId: string
    if (existingLocalId) {
      // Reuse existing media
      localId = existingLocalId
      reusedLocalIds.add(localId)
    } else {
      // Save new media
      localId = await storage.saveMediaToLocal(
        accountDid,
        path,
        image.source.mime,
      )
    }

    refs.push({
      localId,
      type: 'image',
      mimeType: image.source.mime,
      width: image.transformed?.width || image.source.width,
      height: image.transformed?.height || image.source.height,
      altText: image.alt,
    })
  }

  return refs
}

/**
 * Serialize video for storage
 */
async function serializeVideo(
  accountDid: string,
  videoState: VideoState,
  pathToLocalId: Map<string, string>,
  reusedLocalIds: Set<string>,
): Promise<LocalMediaRef | undefined> {
  // Only save videos that have been compressed (have a video file)
  if (!videoState.video) {
    return undefined
  }

  const video = videoState.video
  const path = video.uri

  // Check if this video is already in drafts storage
  let existingLocalId: string | null | undefined = pathToLocalId.get(path)

  if (!existingLocalId) {
    existingLocalId = storage.extractLocalIdFromPath(accountDid, path)
  }

  let localId: string
  if (existingLocalId) {
    // Reuse existing media
    localId = existingLocalId
    reusedLocalIds.add(localId)
  } else {
    // Save new media
    localId = await storage.saveMediaToLocal(accountDid, path, video.mimeType)
  }

  return {
    localId,
    type: 'video',
    mimeType: video.mimeType,
    width: videoState.asset?.width || 0,
    height: videoState.asset?.height || 0,
    altText: videoState.altText || '',
  }
}

/**
 * Serialize GIF for storage (just metadata, no file)
 */
function serializeGif(gifMedia: {
  type: 'gif'
  gif: {
    id: string
    media_formats: Record<string, {url: string; dims: number[]}>
  }
  alt: string
}): StoredGif {
  const gif = gifMedia.gif
  const gifFormat = gif.media_formats.gif || gif.media_formats.mediumgif

  return {
    tenorId: gif.id,
    url: gifFormat?.url || '',
    width: gifFormat?.dims?.[0] || 0,
    height: gifFormat?.dims?.[1] || 0,
    altText: gifMedia.alt,
  }
}

/**
 * Load media from storage and return paths/URLs for use in composer
 */
export async function loadDraftMedia(
  accountDid: string,
  draft: StoredDraft,
): Promise<Map<string, string>> {
  const mediaMap = new Map<string, string>()

  for (const post of draft.posts) {
    if (post.images) {
      for (const image of post.images) {
        try {
          const path = await storage.loadMediaFromLocal(
            accountDid,
            image.localId,
          )
          mediaMap.set(image.localId, path)
        } catch (e) {
          // Media file may have been deleted
          console.warn(`Failed to load image ${image.localId}`, e)
        }
      }
    }
    if (post.video) {
      try {
        const path = await storage.loadMediaFromLocal(
          accountDid,
          post.video.localId,
        )
        mediaMap.set(post.video.localId, path)
      } catch (e) {
        console.warn(`Failed to load video ${post.video.localId}`, e)
      }
    }
  }

  return mediaMap
}
