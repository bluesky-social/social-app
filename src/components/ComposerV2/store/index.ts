import {type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import type * as types from '#/components/ComposerV2/store/types'
import {
  startImageUpload,
  startVideoUpload,
  type UploadTask,
} from '#/components/ComposerV2/store/uploads'
import {buildPostMediaItem} from '#/components/ComposerV2/store/utils/buildPostMediaItem'
import {buildThreadPost} from '#/components/ComposerV2/store/utils/buildThreadPost'
import {computePostMediaSelectionsRemaining} from '#/components/ComposerV2/store/utils/computePostMediaSelectionsRemaining'
import {filterMediaInputs} from '#/components/ComposerV2/store/utils/filterMediaInputs'

type Listener = () => void

export function createThreadStore(options: {
  agent: AtpAgent
  /** Override id generation; useful for deterministic tests. */
  __createId?: () => string
}) {
  const id = options.__createId ?? nanoid
  const agent = options.agent
  let state: types.ThreadState = {
    posts: {[id()]: buildThreadPost()},
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
  function mutateState(fn: (s: types.ThreadState) => types.ThreadState | null) {
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
          next[newId] = buildThreadPost()
        }
        next[k] = v
        if (position === 'after' && k === postId) {
          next[newId] = buildThreadPost()
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

  /**
   * Add one or more media items to a post and start any required uploads.
   * Accepts a heterogeneous list (images, video, gif). Gifs don't kick off
   * an upload task; images and videos do.
   *
   * Returns the new media ids in input order, or undefined if the postId
   * doesn't exist (no items are added in that case).
   */
  function addMedia(
    postId: string,
    inputs: types.AddMediaInput[],
  ): string[] | undefined {
    if (!(postId in state.posts)) return undefined
    if (inputs.length === 0) return []

    const accepted = filterMediaInputs(state.posts[postId].media, inputs)
    if (accepted.length === 0) return []

    const newIds = accepted.map(() => id())
    const newItems: types.PostEmbedMedia[] = accepted.map((input, i) =>
      buildPostMediaItem(input, {id: newIds[i], postId}),
    )

    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = setPostMedia(post, [...post.media, ...newItems])
      s.isDirty = true
      return s
    })

    for (let i = 0; i < accepted.length; i++) {
      const input = accepted[i]
      const mediaId = newIds[i]
      if (input.kind === 'image') {
        uploadTasks.set(
          mediaId,
          startImageUpload({
            postId,
            mediaId,
            uri: input.uri,
            agent,
            setUploadStatus,
          }),
        )
      } else if (input.kind === 'video') {
        uploadTasks.set(
          mediaId,
          startVideoUpload({
            postId,
            mediaId,
            uri: input.uri,
            agent,
            setUploadStatus,
          }),
        )
      }
      // gif: no upload task
    }

    return newIds
  }

  function removeMedia(postId: string, mediaId: string) {
    cancelUploadTask(mediaId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const next = post.media.filter(m => m.id !== mediaId)
      if (next.length === post.media.length) return null
      s.posts[postId] = setPostMedia(post, next)
      s.isDirty = true
      return s
    })
  }

  function updateMediaAltText(
    postId: string,
    mediaId: string,
    altText: string,
  ) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      let changed = false
      const media = post.media.map(m => {
        if (m.id !== mediaId) return m
        if (m.altText === altText) return m
        changed = true
        return {...m, altText}
      })
      if (!changed) return null
      s.posts[postId] = setPostMedia(post, media)
      s.isDirty = true
      return s
    })
  }

  /**
   * Restart a failed (or in-flight) upload for an image or video. No-ops on
   * a gif (no upload lifecycle) or on unknown ids.
   */
  function retryMediaUpload(postId: string, mediaId: string) {
    const post = state.posts[postId]
    if (!post) return
    const item = post.media.find(m => m.id === mediaId)
    if (!item) return
    if (item.kind === 'gif') return

    cancelUploadTask(mediaId)
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      const media = p.media.map(m =>
        m.id === mediaId ? {...m, upload: {state: 'pending' as const}} : m,
      )
      s.posts[postId] = setPostMedia(p, media)
      return s
    })
    const start = item.kind === 'image' ? startImageUpload : startVideoUpload
    uploadTasks.set(
      mediaId,
      start({
        postId,
        mediaId,
        uri: item.uri,
        agent,
        setUploadStatus,
      }),
    )
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
        ? {...statusInput, retry: () => retryMediaUpload(postId, mediaId)}
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
      s.posts[postId] = setPostMedia(post, media)
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

  /**
   * The single chokepoint for replacing a post's media array. Recomputes the
   * derived selectionsRemaining flags so they never drift from the array.
   */
  function setPostMedia(
    post: types.ThreadPost,
    media: types.PostEmbedMedia[],
  ): types.ThreadPost {
    return {...post, media, ...computePostMediaSelectionsRemaining(media)}
  }

  return {
    actions: {
      setPostText,
      setPostLanguages,
      setPostLabels,
      addPost,
      removePost,
      addMedia,
      removeMedia,
      updateMediaAltText,
      retryMediaUpload,
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
