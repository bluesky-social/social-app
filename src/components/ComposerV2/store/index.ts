import {type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import * as types from '#/components/ComposerV2/store/types'
import {startImageUpload, type UploadTask} from '#/components/ComposerV2/store/uploads'

type Listener = () => void

export function createThreadStore(options: {
  agent: AtpAgent
  /** Override id generation; useful for deterministic tests. */
  __createId?: () => string
}) {
  const id = options.__createId ?? nanoid
  const agent = options.agent
  let state: types.ThreadState = {
    posts: {[id()]: createEmptyThreadPost()},
    isDirty: false,
    draftId: undefined,
  }

  const listeners = new Set<Listener>()
  let destroyed = false

  /**
   * In-flight upload tasks keyed by media id. Held outside of state because
   * cancellation handles aren't serializable. Cleared on terminal status
   * (uploaded/failed) and on store destroy.
   */
  const uploadTasks = new Map<string, UploadTask>()

  /**
   * Action bodies mutate `s` in place. Returning `null` signals a no-op (the
   * state ref is preserved and listeners are not notified). Otherwise we
   * shallow-clone the top-level object so getState() returns a new reference,
   * which is what useSyncExternalStore needs to trigger a rerender.
   */
  function mutateState(
    fn: (s: types.ThreadState) => types.ThreadState | null,
  ) {
    if (destroyed) return
    const next = fn(state)
    if (next === null) return
    state = {...next}
    for (const listener of listeners) listener()
  }

  /**
   * Actions
   */

  function setPostText(postId: string, text: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, text}
      s.isDirty = true
      return s
    })
  }

  function setPostLanguages(postId: string, languages: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, langs: languages}
      s.isDirty = true
      return s
    })
  }

  function setPostLabels(postId: string, labels: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, labels}
      s.isDirty = true
      return s
    })
  }

  function addPost(position: 'before' | 'after', postId: string): string {
    const newId = id()
    mutateState(s => {
      if (!(postId in s.posts)) return null
      // Object key order is insertion order, so to insert mid-thread we
      // rebuild the posts object.
      const next: Record<string, types.ThreadPost> = {}
      for (const [k, v] of Object.entries(s.posts)) {
        if (position === 'before' && k === postId) {
          next[newId] = createEmptyThreadPost()
        }
        next[k] = v
        if (position === 'after' && k === postId) {
          next[newId] = createEmptyThreadPost()
        }
      }
      s.posts = next
      s.isDirty = true
      return s
    })
    return newId
  }

  function removePost(postId: string) {
    mutateState(s => {
      // The composer always has at least one post.
      if (Object.keys(s.posts).length <= 1) return null
      if (!(postId in s.posts)) return null
      // Cancel any in-flight uploads for media on this post before dropping it.
      for (const m of s.posts[postId].media) cancelUploadTask(m.id)
      delete s.posts[postId]
      s.isDirty = true
      return s
    })
  }

  function queueImageUpload(
    postId: string,
    input: {
      uri: string
      width: number
      height: number
      altText?: string
    },
  ): string | undefined {
    if (!(postId in state.posts)) return undefined
    const imageId = id()
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const item: types.PostEmbedMedia = {
        kind: 'image',
        id: imageId,
        postId,
        uri: input.uri,
        width: input.width,
        height: input.height,
        altText: input.altText ?? '',
        upload: {state: 'pending'},
      }
      s.posts[postId] = {...post, media: [...post.media, item]}
      s.isDirty = true
      return s
    })
    uploadTasks.set(
      imageId,
      startImageUpload({
        postId,
        mediaId: imageId,
        uri: input.uri,
        agent,
        setUploadStatus,
      }),
    )
    return imageId
  }

  function removeImage(postId: string, imageId: string) {
    cancelUploadTask(imageId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const next = post.media.filter(m => m.id !== imageId)
      if (next.length === post.media.length) return null
      s.posts[postId] = {...post, media: next}
      s.isDirty = true
      return s
    })
  }

  function retryImageUpload(postId: string, imageId: string) {
    const post = state.posts[postId]
    if (!post) return
    const item = post.media.find(m => m.id === imageId)
    if (!item || item.kind !== 'image') return

    cancelUploadTask(imageId)
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      const media = p.media.map(m =>
        m.id === imageId ? {...m, upload: {state: 'pending' as const}} : m,
      )
      s.posts[postId] = {...p, media}
      return s
    })
    uploadTasks.set(
      imageId,
      startImageUpload({
        postId,
        mediaId: imageId,
        uri: item.uri,
        agent,
        setUploadStatus,
      }),
    )
  }

  function setImageAltText(postId: string, imageId: string, altText: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      let changed = false
      const media = post.media.map(m => {
        if (m.id !== imageId || m.kind !== 'image') return m
        if (m.altText === altText) return m
        changed = true
        return {...m, altText}
      })
      if (!changed) return null
      s.posts[postId] = {...post, media}
      s.isDirty = true
      return s
    })
  }

  /**
   * Public so the simulated upload worker can push progress in. Real callers
   * should not invoke this directly; use queueImageUpload / retryImageUpload.
   *
   * Failed inputs are wrapped here with a `retry()` method bound to this
   * (postId, mediaId) so consumers reading the status from state can retry
   * without having to look up the ids themselves.
   */
  function setUploadStatus(
    postId: string,
    mediaId: string,
    statusInput: types.UploadStatus,
  ) {
    const status: types.PostMediaUploadStatus =
      statusInput.state === 'failed'
        ? {...statusInput, retry: () => retryImageUpload(postId, mediaId)}
        : statusInput

    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const idx = post.media.findIndex(m => m.id === mediaId)
      if (idx === -1) return null
      const found = post.media[idx]
      // Gifs don't have an upload lifecycle.
      if (found.kind === 'gif') return null
      const media = post.media.slice()
      media[idx] = {...found, upload: status}
      s.posts[postId] = {...post, media}
      // Upload progress isn't a user edit, so don't mark dirty here.
      return s
    })
    if (status.state === 'uploaded' || status.state === 'failed') {
      uploadTasks.delete(mediaId)
    }
  }

  function cancelUploadTask(mediaId: string) {
    const task = uploadTasks.get(mediaId)
    if (task) {
      task.cancel()
      uploadTasks.delete(mediaId)
    }
  }

  return {
    actions: {
      setPostText,
      setPostLanguages,
      setPostLabels,
      addPost,
      removePost,
      queueImageUpload,
      removeImage,
      retryImageUpload,
      setImageAltText,
      setUploadStatus,
    },
    destroy() {
      destroyed = true
      for (const task of uploadTasks.values()) task.cancel()
      uploadTasks.clear()
    },
    getState() {
      return state
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function createEmptyThreadPost(): types.ThreadPost {
  return {
    text: '',
    langs: [],
    labels: [],
    media: [],
    external: undefined,
    quote: undefined,
  }
}
