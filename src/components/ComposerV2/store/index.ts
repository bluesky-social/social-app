import {type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {type resolveLink} from '#/lib/api/resolve'
import {startUriResolution} from '#/components/ComposerV2/store/linkResolution'
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
  /** Override link resolver; useful for deterministic tests. */
  __resolveLink?: typeof resolveLink
}) {
  const id = options.__createId ?? nanoid
  const agent = options.agent
  const resolveLinkOverride = options.__resolveLink
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
   * Generation counter per post for embed link resolution. Cancellation is
   * implemented by ignoring stale resolution callbacks: every action that
   * starts or invalidates a resolution (addUri, removeEmbed, removePost,
   * destroy) bumps the post's gen, and the worker callback compares its
   * captured gen against the current value before writing to state.
   */
  const embedGenByPost = new Map<string, number>()

  function bumpEmbedGen(postId: string): number {
    const next = (embedGenByPost.get(postId) ?? 0) + 1
    embedGenByPost.set(postId, next)
    return next
  }

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
      // Bump (and drop) the embed gen so a stale resolution callback for
      // this post can never write back into state.
      bumpEmbedGen(postId)
      embedGenByPost.delete(postId)
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

    // Embeds (external link cards, feed/list/starter-pack record cards, and
    // the in-flight pending state) are mutually exclusive with media. This
    // rule is permanent (unlike the kind/cap rules in filterMediaInputs) so
    // it lives here at the action boundary rather than inside the filter.
    if (state.posts[postId].embed !== undefined) return []

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
   * Generic URI handler. Sets `embed` to `pending` synchronously, kicks off
   * `resolveLink`, and routes the outcome:
   * - Bluesky post -> goes to the post's `quote` field (clears embed). If
   *   `quote` is already set, the new outcome is dropped silently to
   *   preserve the user's prior selection.
   * - Feed / list / starter-pack / external -> stays on `embed`, unless the
   *   post has media in which case it's dropped silently (embed cleared).
   * - Failure -> embed is set to a `failed` state with a bound `retry()` that
   *   re-runs `addUri` for the same URI.
   *
   * Cancellation is gen-based: any later addUri / removeEmbed / removePost /
   * destroy invalidates this call's outcome before it can land.
   */
  function addUri(postId: string, uri: string) {
    if (!(postId in state.posts)) return
    const gen = bumpEmbedGen(postId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = setPostEmbed(post, {state: 'pending', uri})
      s.isDirty = true
      return s
    })
    startUriResolution({
      postId,
      uri,
      resolveLink: resolveLinkOverride,
      onResolve: handleEmbedResolution(gen),
    })
  }

  function handleEmbedResolution(gen: number) {
    return (postId: string, outcome: types.LinkResolutionOutcome) => {
      if (destroyed) return
      if (embedGenByPost.get(postId) !== gen) return
      if (outcome.kind === 'post') {
        mutateState(s => {
          const post = s.posts[postId]
          if (!post) return null
          if (post.quote !== undefined) {
            // Quote already set: drop the post outcome, just clear pending.
            s.posts[postId] = setPostEmbed(post, undefined)
            return s
          }
          s.posts[postId] = setPostEmbed(
            {
              ...post,
              quote: {
                uri: outcome.record.uri,
                cid: outcome.record.cid,
                view: outcome.view,
              },
            },
            undefined,
          )
          return s
        })
        return
      }
      // outcome.kind === 'embed'
      const post = state.posts[postId]
      if (!post) return
      if (post.media.length > 0) {
        // Embed-vs-media collision: silent drop, clear pending.
        mutateState(s => {
          const p = s.posts[postId]
          if (!p) return null
          s.posts[postId] = setPostEmbed(p, undefined)
          return s
        })
        return
      }
      const embed = outcome.embed
      const stored: types.PostEmbed =
        embed.state === 'failed'
          ? {...embed, retry: () => addUri(postId, embed.uri)}
          : embed
      mutateState(s => {
        const p = s.posts[postId]
        if (!p) return null
        s.posts[postId] = setPostEmbed(p, stored)
        return s
      })
    }
  }

  function removeEmbed(postId: string) {
    bumpEmbedGen(postId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (post.embed === undefined) return null
      s.posts[postId] = setPostEmbed(post, undefined)
      s.isDirty = true
      return s
    })
  }

  function setQuoteEmbed(postId: string, quote: types.PostEmbedQuote) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, quote}
      s.isDirty = true
      return s
    })
  }

  function removeQuoteEmbed(postId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (post.quote === undefined) return null
      s.posts[postId] = {...post, quote: undefined}
      s.isDirty = true
      return s
    })
  }

  /**
   * Public so the simulated upload worker can push progress in. Real callers
   * should not invoke this directly; use addMedia / retryMediaUpload.
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
   * Single chokepoint for replacing a post's media array. Recomputes the
   * derived selectionsRemaining flags so they never drift from the array.
   */
  function setPostMedia(
    post: types.ThreadPost,
    media: types.PostEmbedMedia[],
  ): types.ThreadPost {
    return {
      ...post,
      media,
      ...computePostMediaSelectionsRemaining(media, post.embed),
    }
  }

  /**
   * Single chokepoint for replacing a post's embed slot. Mirrors
   * setPostMedia so the selectionsRemaining flags stay consistent (any
   * embed - including pending and failed - blocks all media selections).
   */
  function setPostEmbed(
    post: types.ThreadPost,
    embed: types.PostEmbed | undefined,
  ): types.ThreadPost {
    return {
      ...post,
      embed,
      ...computePostMediaSelectionsRemaining(post.media, embed),
    }
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
      addUri,
      removeEmbed,
      setQuoteEmbed,
      removeQuoteEmbed,
      setUploadStatus,
    },
    destroy() {
      destroyed = true
      for (const task of uploadTasks.values()) task.cancel()
      uploadTasks.clear()
      embedGenByPost.clear()
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
