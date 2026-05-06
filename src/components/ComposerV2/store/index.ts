import {type AppBskyFeedDefs, type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {
  type ResolvedLink,
  resolveLink as importedResolveLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {createPublicAgent} from '#/state/session/agent'
import type * as types from '#/components/ComposerV2/store/types'
import {
  startImageUpload,
  startVideoUpload,
  type UploadTask,
} from '#/components/ComposerV2/store/uploads'
import {buildPostMediaItem} from '#/components/ComposerV2/store/utils/buildPostMediaItem'
import {buildThreadPost} from '#/components/ComposerV2/store/utils/buildThreadPost'
import {classifyUriTarget} from '#/components/ComposerV2/store/utils/classifyUriTarget'
import {computePostMediaSelectionsRemaining} from '#/components/ComposerV2/store/utils/computePostMediaSelectionsRemaining'
import {createAsyncTaskRev} from '#/components/ComposerV2/store/utils/createAsyncTaskRev'
import {filterMediaInputs} from '#/components/ComposerV2/store/utils/filterMediaInputs'
import {parseResolveLinkError} from '#/components/ComposerV2/store/utils/parseResolveLinkError'

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
   * Per-slot revision counters. Quote and embed are orthogonal slots, so
   * each has its own counter; invalidating one doesn't invalidate the
   * other. Every action that starts or supersedes a resolution for a slot
   * calls `incrementFor(postId)`, and the worker callback closes over the
   * returned `isCurrent` checker to decide whether to write back.
   */
  const quoteRev = createAsyncTaskRev()
  const embedRev = createAsyncTaskRev()

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
      // Drop both rev entries so any stale resolution callbacks for this
      // post can never write back into state.
      quoteRev.clearFor(postId)
      embedRev.clearFor(postId)
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
   * Generic URI handler. Pre-classifies the URI from its URL pattern to
   * decide which slot the eventual data will land in:
   *
   * - Bluesky post URL -> `quote` slot (coexists with media).
   * - Anything else (feed / list / starter-pack / external) -> `embed` slot
   *   (mutually exclusive with media).
   *
   * Conflict checks happen synchronously based on the target slot:
   * - If targeting quote and quote is already set -> no-op (preserves prior).
   * - If targeting embed and embed is already set -> no-op.
   * - If targeting embed and media is set -> no-op.
   *
   * Otherwise, pending state is written to the target slot synchronously and
   * `resolveLink` runs in the background. The outcome lands in the same slot
   * (resolved or failed). Cancellation is per-slot rev-based.
   */
  function addUri(postId: string, uri: string) {
    const post = state.posts[postId]
    if (!post) return

    const resolve = resolveLinkOverride ?? importedResolveLink
    const target = classifyUriTarget(uri)

    if (target === 'quote') {
      // No-op only when the slot has a settled value. Pending and failed
      // states are replaceable (failed.retry() relies on this).
      if (post.quote?.state === 'resolved') return
      const rev = quoteRev.incrementFor(postId)
      mutateState(s => {
        const p = s.posts[postId]
        if (!p) return null
        s.posts[postId] = setPostQuote(p, {state: 'pending', uri})
        s.isDirty = true
        return s
      })
      resolve(createPublicAgent(), uri).then(
        link => applyQuoteResolved(rev, postId, uri, link),
        err => applyQuoteFailed(rev, postId, uri, err),
      )
      return
    }

    // target === 'embed'
    // Same rule as quote: settled values block; pending / failed are
    // replaceable (so retry() works on a failed embed).
    const embedSettled =
      post.embed !== undefined &&
      post.embed.state !== 'pending' &&
      post.embed.state !== 'failed'
    if (embedSettled) return
    if (post.media.length > 0) return

    const rev = embedRev.incrementFor(postId)
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      s.posts[postId] = setPostEmbed(p, {state: 'pending', uri})
      s.isDirty = true
      return s
    })
    resolve(createPublicAgent(), uri).then(
      link => applyEmbedResolved(rev, postId, uri, link),
      err => applyEmbedFailed(rev, postId, uri, err),
    )
  }

  function applyQuoteResolved(
    rev: number,
    postId: string,
    uri: string,
    link: ResolvedLink,
  ) {
    if (destroyed) return
    if (!quoteRev.isCurrentFor(postId, rev)) return
    // Pre-classification said this was a post URL. If resolveLink disagrees
    // (rare, since both use the same URL patterns), surface as a generic
    // failure in the quote slot.
    if (link.type !== 'record' || link.kind !== 'post') {
      applyQuoteFailed(rev, postId, uri, new Error('Could not resolve post'))
      return
    }
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      s.posts[postId] = setPostQuote(p, {
        state: 'resolved',
        uri: link.record.uri,
        cid: link.record.cid,
        view: link.view,
      })
      return s
    })
  }

  function applyQuoteFailed(
    rev: number,
    postId: string,
    uri: string,
    err: unknown,
  ) {
    if (destroyed) return
    if (!quoteRev.isCurrentFor(postId, rev)) return
    // Non-retryable failure codes (e.g. embedding-disabled) get a failed
    // state with no `retry()`; the user has to remove the embed manually.
    const {code, isRetryable} = parseResolveLinkError(err)
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      s.posts[postId] = setPostQuote(p, {
        state: 'failed',
        uri,
        error: stringifyError(err),
        code,
        retry: isRetryable ? () => addUri(postId, uri) : undefined,
      })
      return s
    })
  }

  function applyEmbedResolved(
    rev: number,
    postId: string,
    uri: string,
    link: ResolvedLink,
  ) {
    if (destroyed) return
    if (!embedRev.isCurrentFor(postId, rev)) return
    // Pre-classification said this was a non-post URL. If resolveLink
    // surprises us with a post outcome, treat as failure rather than
    // silently moving slots.
    if (link.type === 'record' && link.kind === 'post') {
      applyEmbedFailed(
        rev,
        postId,
        uri,
        new Error('Unexpected post outcome for non-post URL'),
      )
      return
    }
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      s.posts[postId] = setPostEmbed(p, resolvedLinkToEmbed(link))
      return s
    })
  }

  function applyEmbedFailed(
    rev: number,
    postId: string,
    uri: string,
    err: unknown,
  ) {
    if (destroyed) return
    if (!embedRev.isCurrentFor(postId, rev)) return
    const {code, isRetryable} = parseResolveLinkError(err)
    mutateState(s => {
      const p = s.posts[postId]
      if (!p) return null
      s.posts[postId] = setPostEmbed(p, {
        state: 'failed',
        uri,
        error: stringifyError(err),
        code,
        retry: isRetryable ? () => addUri(postId, uri) : undefined,
      })
      return s
    })
  }

  function removeEmbed(postId: string) {
    embedRev.incrementFor(postId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (post.embed === undefined) return null
      s.posts[postId] = setPostEmbed(post, undefined)
      s.isDirty = true
      return s
    })
  }

  /**
   * Direct setter for an already-resolved quote. Used for draft restore and
   * any UI flow that already has the post ref+view in hand. Bumps the quote
   * rev so any in-flight resolution is invalidated.
   */
  function setQuoteEmbed(
    postId: string,
    ref: {uri: string; cid: string; view?: AppBskyFeedDefs.PostView},
  ) {
    quoteRev.incrementFor(postId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = setPostQuote(post, {
        state: 'resolved',
        uri: ref.uri,
        cid: ref.cid,
        view: ref.view,
      })
      s.isDirty = true
      return s
    })
  }

  function removeQuoteEmbed(postId: string) {
    quoteRev.incrementFor(postId)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (post.quote === undefined) return null
      s.posts[postId] = setPostQuote(post, undefined)
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

  /**
   * Single chokepoint for replacing a post's quote slot. Quote is
   * orthogonal to media so no selectionsRemaining recomputation is needed.
   */
  function setPostQuote(
    post: types.ThreadPost,
    quote: types.PostEmbedQuote | undefined,
  ): types.ThreadPost {
    return {...post, quote}
  }

  /**
   * Map a non-post ResolvedLink into the PostEmbed shape stored on the post.
   * Callers handle the post-record case separately (those go to quote).
   */
  function resolvedLinkToEmbed(link: ResolvedLink): types.PostEmbed {
    if (link.type === 'external') {
      return {
        state: 'external',
        uri: link.uri,
        title: link.title,
        description: link.description,
        thumb: link.thumb,
      }
    }
    switch (link.kind) {
      case 'feed':
        return {state: 'feed', record: link.record, view: link.view}
      case 'list':
        return {state: 'list', record: link.record, view: link.view}
      case 'starter-pack':
        return {state: 'starter-pack', record: link.record, view: link.view}
      case 'post':
        throw new Error('post records should route to quote, not embed')
    }
  }

  function stringifyError(err: unknown): string {
    return String((err && (err as Error).message) ?? err)
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
      quoteRev.clearAll()
      embedRev.clearAll()
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
