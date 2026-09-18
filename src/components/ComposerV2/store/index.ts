import {nanoid} from 'nanoid/non-secure'

import {
  type LinkResolvers,
  type ResolvedLink,
  resolveLink as importedResolveLink,
  type resolveLink,
} from '#/lib/api/resolve'
import type * as types from '#/components/ComposerV2/store/types'
import {
  startImageUpload,
  startVideoUpload,
  type UploadTask,
} from '#/components/ComposerV2/store/uploads'
import {buildPostMediaItem} from '#/components/ComposerV2/store/utils/buildPostMediaItem'
import {buildThreadPost} from '#/components/ComposerV2/store/utils/buildThreadPost'
import {
  buildThreadState,
  cloneSerializable,
} from '#/components/ComposerV2/store/utils/buildThreadState'
import {
  type AttachmentSlot,
  classifyUriTarget,
} from '#/components/ComposerV2/store/utils/classifyUriTarget'
import {computePostMediaSelectionsRemaining} from '#/components/ComposerV2/store/utils/computePostMediaSelectionsRemaining'
import {createAsyncTaskRev} from '#/components/ComposerV2/store/utils/createAsyncTaskRev'
import {filterMediaInputs} from '#/components/ComposerV2/store/utils/filterMediaInputs'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {parseResolveLinkError} from '#/components/ComposerV2/store/utils/parseResolveLinkError'

/** One isolated thread composition session, independent of React. */
export function createThreadStore(options: {
  resolvers: LinkResolvers
  initialState?: types.ThreadStoreInitialState
  /** Override id generation; useful for deterministic tests. */
  __createId?: () => string
  /** Override link resolver; useful for deterministic tests. */
  __resolveLink?: typeof resolveLink
}) {
  const id = options.__createId ?? nanoid
  const resolve = options.__resolveLink ?? importedResolveLink
  let state = buildThreadState(options.initialState ?? {}, id)
  const listeners = new Set<() => void>()
  let destroyed = false

  /** Cancellation handles belong to the session, not its published snapshots. */
  const uploadTasks = new Map<string, UploadTask>()
  /** Replacing one attachment slot must not invalidate work in the other. */
  const resolutionRevs = {
    record: createAsyncTaskRev(),
    media: createAsyncTaskRev(),
  }

  /**
   * Actions replace touched posts and mutate only this shallow working copy.
   * Returning null preserves the current snapshot and skips notification.
   */
  function mutateState(fn: (s: types.ThreadState) => types.ThreadState | null) {
    if (destroyed) return
    const next = fn({...state, posts: {...state.posts}})
    if (next === null) return
    state = next
    for (const listener of listeners) listener()
  }

  function setPostText(postId: string, text: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post || post.text === text) return null
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

  function setThreadgateAllowRules(
    allow: readonly types.ThreadgateAllowRule[] | undefined,
  ) {
    mutateState(s => {
      if (serializableEqual(s.threadgateAllowRules, allow)) return null
      s.threadgateAllowRules = allow?.map(rule => cloneSerializable(rule))
      s.isDirty = true
      return s
    })
  }

  function setPostgateConfiguration(
    configuration: types.PostgateConfigurationInput,
  ) {
    mutateState(s => {
      const embeddingRules = configuration.embeddingRules ?? []
      if (serializableEqual(s.postgateEmbeddingRules, embeddingRules)) {
        return null
      }
      s.postgateEmbeddingRules = embeddingRules.map(rule =>
        cloneSerializable(rule),
      )
      s.isDirty = true
      return s
    })
  }

  function setPostgateEmbeddingRules(
    embeddingRules: readonly types.PostgateEmbeddingRule[],
  ) {
    setPostgateConfiguration({embeddingRules})
  }

  function addPost(position: 'before' | 'after', postId: string): string {
    const newId = id()
    mutateState(s => {
      if (!(postId in s.posts)) return null
      // Rebuild insertion order without changing existing post identities.
      const next: Record<string, types.ThreadPost> = {}
      for (const [k, v] of Object.entries(s.posts)) {
        if (position === 'before' && k === postId) {
          next[newId] = buildThreadPost(newId, id)
        }
        next[k] = v
        if (position === 'after' && k === postId) {
          next[newId] = buildThreadPost(newId, id)
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
      if (Object.keys(s.posts).length <= 1 || !(postId in s.posts)) return null
      for (const item of getMediaItems(s.posts[postId].attachments.media)) {
        cancelUploadTask(item.id)
      }
      resolutionRevs.record.clearFor(postId)
      resolutionRevs.media.clearFor(postId)
      delete s.posts[postId]
      s.isDirty = true
      return s
    })
  }

  /**
   * Adds compatible items to the media slot and starts uploads eagerly.
   * Existing record attachments never block media. Returns accepted item IDs.
   */
  function addMedia(
    postId: string,
    inputs: types.AddMediaInput[],
  ): string[] | undefined {
    if (destroyed || !(postId in state.posts)) return undefined
    const post = state.posts[postId]
    const accepted = filterMediaInputs(post.attachments.media, inputs)
    if (accepted.length === 0) return []
    const items = accepted.map(input =>
      buildPostMediaItem(input, {id: id(), postId}),
    )

    resolutionRevs.media.incrementFor(postId)
    mutateState(s => {
      s.posts[postId] = setPostMediaItems(post, [
        ...getMediaItems(post.attachments.media),
        ...items,
      ])
      s.isDirty = true
      return s
    })
    for (const item of items) startMediaUpload(postId, item.id)
    return items.map(item => item.id)
  }

  /** Removes one selected item; use removeMediaAttachment to clear the slot. */
  function removeMedia(postId: string, mediaId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const items = getMediaItems(post.attachments.media)
      const next = items.filter(item => item.id !== mediaId)
      if (next.length === items.length) return null
      cancelUploadTask(mediaId)
      s.posts[postId] = setPostMediaItems(post, next)
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
      const items = getMediaItems(post.attachments.media).map(item => {
        if (item.id !== mediaId || item.altText === altText) return item
        changed = true
        return {...item, altText}
      })
      if (!changed) return null
      s.posts[postId] = setPostMediaItems(post, items)
      s.isDirty = true
      return s
    })
  }

  /** Restarts an image/video upload; cards, GIFs, and missing items are no-ops. */
  function retryMediaUpload(postId: string, mediaId: string) {
    if (destroyed) return
    const post = state.posts[postId]
    if (!post) return
    const items = getMediaItems(post.attachments.media)
    const item = items.find(m => m.id === mediaId)
    if (!item || item.kind === 'gif') return

    cancelUploadTask(mediaId)
    const pending = {...item, upload: {state: 'pending' as const}}
    mutateState(s => {
      s.posts[postId] = setPostMediaItems(
        post,
        items.map(m => (m.id === mediaId ? pending : m)),
      )
      return s
    })
    startMediaUpload(postId, mediaId)
  }

  /**
   * Reserve the record or media slot before resolving a URL. Settled values
   * block new candidates; pending/failed candidates can be superseded.
   */
  function addUri(postId: string, uri: string) {
    setUriAttachment(postId, classifyUriTarget(uri), uri, true)
  }

  /** Retries keep their assigned slot and are not new content edits. */
  function setUriAttachment(
    postId: string,
    slot: AttachmentSlot,
    uri: string,
    markDirty: boolean,
  ) {
    if (destroyed) return
    const post = state.posts[postId]
    if (!post || post.attachments[slot]?.state === 'resolved') return
    const rev = resolutionRevs[slot].incrementFor(postId)
    mutateState(s => {
      s.posts[postId] = setPostResolution(post, slot, {state: 'pending', uri})
      if (markDirty) s.isDirty = true
      return s
    })
    startUriResolution(slot, rev, postId, uri)
  }

  /** Initial hydration shares the worker but does not dispatch a dirtying edit. */
  function startUriResolution(
    slot: AttachmentSlot,
    rev: number,
    postId: string,
    uri: string,
  ) {
    if (destroyed || !resolutionRevs[slot].isCurrentFor(postId, rev)) return
    resolve(options.resolvers, uri).then(
      link => applyResolved(slot, rev, postId, uri, link),
      err => applyFailed(slot, rev, postId, uri, err),
    )
  }

  function applyResolved(
    slot: AttachmentSlot,
    rev: number,
    postId: string,
    uri: string,
    link: ResolvedLink,
  ) {
    if (destroyed || !resolutionRevs[slot].isCurrentFor(postId, rev)) return
    if ((link.type === 'record') !== (slot === 'record')) {
      applyFailed(
        slot,
        rev,
        postId,
        uri,
        new Error('Unexpected attachment type'),
      )
      return
    }
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (link.type === 'record') {
        const {type: _type, ...record} = link
        s.posts[postId] = setPostRecord(post, {state: 'resolved', ...record})
      } else if (link.type === 'external') {
        const {type: _type, ...external} = link
        s.posts[postId] = setPostMedia(post, {
          state: 'resolved',
          kind: 'external',
          ...external,
        })
      } else {
        const {type: _type, ...invite} = link
        s.posts[postId] = setPostMedia(post, {
          state: 'resolved',
          kind: 'chat-invite',
          ...invite,
        })
      }
      return s
    })
  }

  function applyFailed(
    slot: AttachmentSlot,
    rev: number,
    postId: string,
    uri: string,
    err: unknown,
  ) {
    if (destroyed || !resolutionRevs[slot].isCurrentFor(postId, rev)) return
    const {code, isRetryable} = parseResolveLinkError(err)
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = setPostResolution(post, slot, {
        state: 'failed',
        uri,
        error: String((err && (err as Error).message) ?? err),
        code,
        retry: isRetryable
          ? () => {
              if (resolutionRevs[slot].isCurrentFor(postId, rev)) {
                setUriAttachment(postId, slot, uri, false)
              }
            }
          : undefined,
      })
      return s
    })
  }

  /** Direct insertion of a known record replaces only the record slot. */
  function setRecordAttachment(
    postId: string,
    value: types.RecordAttachmentValue,
  ) {
    if (destroyed || !state.posts[postId]) return
    resolutionRevs.record.incrementFor(postId)
    mutateState(s => {
      s.posts[postId] = setPostRecord(s.posts[postId], {
        state: 'resolved',
        ...value,
      })
      s.isDirty = true
      return s
    })
  }

  function removeRecordAttachment(postId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post || !post.attachments.record) return null
      resolutionRevs.record.incrementFor(postId)
      s.posts[postId] = setPostRecord(post, undefined)
      s.isDirty = true
      return s
    })
  }

  /** Clears a card or all selected media, cancelling its pending work. */
  function removeMediaAttachment(postId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post || !post.attachments.media) return null
      resolutionRevs.media.incrementFor(postId)
      for (const item of getMediaItems(post.attachments.media)) {
        cancelUploadTask(item.id)
      }
      s.posts[postId] = setPostMedia(post, undefined)
      s.isDirty = true
      return s
    })
  }

  /** Upload progress does not dirty the draft or affect the record attachment. */
  function setUploadStatus(
    postId: string,
    mediaId: string,
    input: types.UploadStatus,
  ) {
    const post = state.posts[postId]
    if (destroyed || !post) return
    const items = getMediaItems(post.attachments.media)
    const found = items.find(item => item.id === mediaId)
    if (!found || found.kind === 'gif') return
    if (input.state === 'uploaded' || input.state === 'failed') {
      cancelUploadTask(mediaId)
    }
    const status: types.PostMediaUploadStatus =
      input.state === 'failed'
        ? {...input, retry: () => retryMediaUpload(postId, mediaId)}
        : input
    mutateState(s => {
      s.posts[postId] = setPostMediaItems(
        post,
        items.map(item =>
          item.id === mediaId ? {...found, upload: status} : item,
        ),
      )
      return s
    })
  }

  function startMediaUpload(postId: string, mediaId: string) {
    if (destroyed || uploadTasks.has(mediaId)) return
    const post = state.posts[postId]
    if (!post) return
    // Read live state: a subscriber may have edited, removed, or retried this item.
    const item = getMediaItems(post.attachments.media).find(
      m => m.id === mediaId,
    )
    if (!item || item.kind === 'gif' || item.upload.state !== 'pending') return
    const start = item.kind === 'image' ? startImageUpload : startVideoUpload
    const task = start({
      postId,
      mediaId: item.id,
      uri: item.uri,
      setUploadStatus: (p, m, status) => {
        if (uploadTasks.get(m) === task) setUploadStatus(p, m, status)
      },
    })
    uploadTasks.set(item.id, task)
  }

  function cancelUploadTask(mediaId: string) {
    const task = uploadTasks.get(mediaId)
    uploadTasks.delete(mediaId)
    task?.cancel()
  }

  /** Regroup only selected items; record identity is unaffected. */
  function setPostMediaItems(
    post: types.ThreadPost,
    items: types.PostMediaItem[],
  ): types.ThreadPost {
    const first = items[0]
    if (!first) return setPostMedia(post, undefined)
    switch (first.kind) {
      case 'image':
        return setPostMedia(post, {
          state: 'resolved',
          kind: 'images',
          items: items.filter(item => item.kind === 'image'),
        })
      case 'video':
      case 'gif':
        return setPostMedia(
          post,
          first.kind === 'video'
            ? {state: 'resolved', kind: 'video', item: first}
            : {state: 'resolved', kind: 'gif', item: first},
        )
    }
  }

  /** All media replacements recompute selection capacity together. */
  function setPostMedia(
    post: types.ThreadPost,
    media: types.MediaAttachment | undefined,
  ): types.ThreadPost {
    return {
      ...post,
      attachments: {...post.attachments, media},
      ...computePostMediaSelectionsRemaining(media),
    }
  }

  function setPostRecord(
    post: types.ThreadPost,
    record: types.RecordAttachment | undefined,
  ): types.ThreadPost {
    return {...post, attachments: {...post.attachments, record}}
  }

  function setPostResolution(
    post: types.ThreadPost,
    slot: AttachmentSlot,
    resolution: types.AttachmentResolution,
  ) {
    return slot === 'record'
      ? setPostRecord(post, resolution)
      : setPostMedia(post, resolution)
  }

  /* The full initial snapshot is ready before any background work begins. */
  for (const [postId, post] of Object.entries(state.posts)) {
    for (const item of getMediaItems(post.attachments.media)) {
      startMediaUpload(postId, item.id)
    }
    for (const slot of ['record', 'media'] as const) {
      const attachment = post.attachments[slot]
      if (attachment?.state === 'pending') {
        const rev = resolutionRevs[slot].incrementFor(postId)
        startUriResolution(slot, rev, postId, attachment.uri)
      }
    }
  }

  return {
    actions: {
      setPostText,
      setPostLanguages,
      setPostLabels,
      setThreadgateAllowRules,
      setPostgateConfiguration,
      setPostgateEmbeddingRules,
      addPost,
      removePost,
      addMedia,
      removeMedia,
      updateMediaAltText,
      retryMediaUpload,
      addUri,
      setRecordAttachment,
      removeRecordAttachment,
      removeMediaAttachment,
      setUploadStatus,
    },
    destroy() {
      destroyed = true
      for (const task of uploadTasks.values()) task.cancel()
      uploadTasks.clear()
      resolutionRevs.record.clearAll()
      resolutionRevs.media.clearAll()
      listeners.clear()
    },
    getState() {
      return state
    },
    subscribe(listener: () => void) {
      if (destroyed) return () => {}
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function serializableEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false
    return (
      left.length === right.length &&
      left.every((value, index) => serializableEqual(value, right[index]))
    )
  }
  if (
    !left ||
    !right ||
    typeof left !== 'object' ||
    typeof right !== 'object'
  ) {
    return false
  }
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every(
    key =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      serializableEqual(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
      ),
  )
}
