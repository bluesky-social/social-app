import {nanoid} from 'nanoid/non-secure'

import {
  type LinkResolvers,
  type ResolvedLink,
  resolveLink as importedResolveLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {
  type ComposerV2OnError,
  isComposerV2Cancellation,
  reportComposerV2Error,
} from '#/components/ComposerV2/errors'
import type * as types from '#/components/ComposerV2/store/types'
import {
  imageUploadDependencies,
  videoUploadDependencies,
} from '#/components/ComposerV2/store/uploadDependencies'
import {
  type PreparedOutput,
  startImageUpload,
  startVideoUpload,
  type UploadRuntime,
  type UploadTask,
  type UploadWorkerOverrides,
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

function isRetryableFailedUpload({item}: {item: types.PostMediaItem}): boolean {
  if (item.kind !== 'image' && item.kind !== 'video') return false
  return item.upload.state === 'failed' && item.upload.retryable === true
}

function serializableEqual({
  left,
  right,
}: {
  left: unknown
  right: unknown
}): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false
    return (
      left.length === right.length &&
      left.every((value, index) =>
        serializableEqual({left: value, right: right[index]}),
      )
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
      serializableEqual({
        left: (left as Record<string, unknown>)[key],
        right: (right as Record<string, unknown>)[key],
      }),
  )
}

/** One isolated thread composition session, independent of React. */
export function createThreadStore({
  resolvers,
  pdsClient,
  pdsUrl,
  i18n,
  initialState,
  onError,
  __createId,
  __resolveLink,
  __uploadWorkers,
}: UploadRuntime & {
  resolvers: LinkResolvers
  initialState?: types.ThreadStoreInitialState
  /** Registered before normalization and eager initialization begin. */
  onError?: ComposerV2OnError
  /** Override id generation; useful for deterministic tests. */
  __createId?: () => string
  /** Override link resolver; useful for deterministic tests. */
  __resolveLink?: typeof resolveLink
  /**
   * Test-only worker seam; never selected implicitly in production. Wrap the
   * real worker to run it with fake dependencies.
   */
  __uploadWorkers?: UploadWorkerOverrides
}) {
  const id = __createId ?? nanoid
  const resolve = __resolveLink ?? importedResolveLink
  let destroyed = false
  let reporting = false
  const reportError: ComposerV2OnError = (event, cause) => {
    if (destroyed || reporting) return
    if (event.source !== 'writer' && isComposerV2Cancellation({cause})) return
    reporting = true
    try {
      reportComposerV2Error({onError, event, cause})
    } finally {
      reporting = false
    }
  }
  let state: types.ThreadState
  try {
    state = buildThreadState({input: initialState ?? {}, createId: id})
  } catch (cause) {
    reportError(
      {
        source: 'initialization',
        code: 'initial-state-failed',
        kind: 'unexpected',
        recovery: 'none',
      },
      cause,
    )
    throw cause
  }
  const listeners = new Set<() => void>()

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

  /** Copy caller-owned editable arrays at the store boundary. */
  function setPostLanguages(postId: string, languages: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, langs: [...languages]}
      s.isDirty = true
      return s
    })
  }

  function setPostLabels(postId: string, labels: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      s.posts[postId] = {...post, labels: [...labels]}
      s.isDirty = true
      return s
    })
  }

  /** Edit explicit post tags without changing rich-text hashtag facets. */
  function setPostTags(postId: string, tags: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (serializableEqual({left: post.tags, right: tags})) return null
      s.posts[postId] = {...post, tags: [...tags]}
      s.isDirty = true
      return s
    })
  }

  /** Copy nested rules so caller mutations cannot alter published snapshots. */
  function setThreadgateAllowRules(
    allow: readonly types.ThreadgateAllowRule[] | undefined,
  ) {
    mutateState(s => {
      if (serializableEqual({left: s.threadgateAllowRules, right: allow}))
        return null
      s.threadgateAllowRules = allow?.map(rule =>
        cloneSerializable({value: rule}),
      )
      s.isDirty = true
      return s
    })
  }

  function setPostgateConfiguration(
    configuration: types.PostgateConfigurationInput,
  ) {
    mutateState(s => {
      const embeddingRules = configuration.embeddingRules ?? []
      if (
        serializableEqual({
          left: s.postgateEmbeddingRules,
          right: embeddingRules,
        })
      ) {
        return null
      }
      s.postgateEmbeddingRules = embeddingRules.map(rule =>
        cloneSerializable({value: rule}),
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

  /** Adds a post and returns its ID only when the insertion succeeds. */
  function addPost(
    position: 'before' | 'after',
    postId: string,
  ): {addedPostId: string} | undefined {
    if (destroyed || !(postId in state.posts)) return undefined
    const newId = id()
    mutateState(s => {
      // Rebuild insertion order without changing existing post identities.
      const next: Record<string, types.ThreadPost> = {}
      for (const [k, v] of Object.entries(s.posts)) {
        if (position === 'before' && k === postId) {
          next[newId] = buildThreadPost({postId: newId, createId: id})
        }
        next[k] = v
        if (position === 'after' && k === postId) {
          next[newId] = buildThreadPost({postId: newId, createId: id})
        }
      }
      s.posts = next
      s.isDirty = true
      return s
    })
    return {addedPostId: newId}
  }

  /**
   * Moves an existing post to its final zero-based thread index without
   * changing its identity. Same-position, invalid, and destroyed-store calls
   * return undefined without publishing a snapshot.
   */
  function movePost(
    postId: string,
    toIndex: number,
  ): {movedPostId: string} | undefined {
    if (destroyed) return undefined
    const postIds = Object.keys(state.posts)
    const fromIndex = postIds.indexOf(postId)
    if (
      fromIndex < 0 ||
      !Number.isInteger(toIndex) ||
      toIndex < 0 ||
      toIndex >= postIds.length ||
      fromIndex === toIndex
    ) {
      return undefined
    }

    mutateState(s => {
      const entries = Object.entries(s.posts)
      const [entry] = entries.splice(fromIndex, 1)
      entries.splice(toIndex, 0, entry)
      const next: Record<string, types.ThreadPost> = {}
      for (const [id, post] of entries) next[id] = post
      s.posts = next
      s.isDirty = true
      return s
    })
    return {movedPostId: postId}
  }

  function removePost(postId: string) {
    mutateState(s => {
      if (Object.keys(s.posts).length <= 1 || !(postId in s.posts)) return null
      for (const item of getMediaItems({
        media: s.posts[postId].attachments.media,
      })) {
        cancelUploadTask(item.id)
      }
      resolutionRevs.record.clearFor({key: postId})
      resolutionRevs.media.clearFor({key: postId})
      delete s.posts[postId]
      s.isDirty = true
      return s
    })
  }

  /**
   * Adds compatible items to the media slot and starts uploads eagerly.
   * Existing record attachments never block media. Returns accepted IDs in
   * `{addedMediaIds}` when the target post exists.
   */
  function addMedia(
    postId: string,
    inputs: types.AddMediaInput[],
  ): {addedMediaIds: string[]} | undefined {
    if (destroyed || !(postId in state.posts)) return undefined
    const post = state.posts[postId]
    const accepted = filterMediaInputs({
      existing: post.attachments.media,
      inputs,
    })
    if (accepted.length === 0) return {addedMediaIds: []}
    const items = accepted.map(input =>
      buildPostMediaItem({input, id: id(), postId}),
    )

    resolutionRevs.media.incrementFor({key: postId})
    mutateState(s => {
      s.posts[postId] = replacePostMediaItems(post, [
        ...getMediaItems({media: post.attachments.media}),
        ...items,
      ])
      s.isDirty = true
      return s
    })
    for (const item of items) startMediaUpload(postId, item.id)
    return {addedMediaIds: items.map(item => item.id)}
  }

  /** Removes one selected item; use removeMediaAttachment to clear the slot. */
  function removeMedia(postId: string, mediaId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const items = getMediaItems({media: post.attachments.media})
      const next = items.filter(item => item.id !== mediaId)
      if (next.length === items.length) return null
      cancelUploadTask(mediaId)
      s.posts[postId] = replacePostMediaItems(post, next)
      s.isDirty = true
      return s
    })
  }

  /** Clears a card or all selected media, cancelling its pending work. */
  function removeMediaAttachment(postId: string) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post || !post.attachments.media) return null
      resolutionRevs.media.incrementFor({key: postId})
      for (const item of getMediaItems({media: post.attachments.media})) {
        cancelUploadTask(item.id)
      }
      s.posts[postId] = replacePostMedia(post, undefined)
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
      const items = getMediaItems({media: post.attachments.media}).map(item => {
        if (item.id !== mediaId || item.altText === altText) return item
        changed = true
        return {...item, altText}
      })
      if (!changed) return null
      s.posts[postId] = replacePostMediaItems(post, items)
      s.isDirty = true
      return s
    })
  }

  /**
   * Replace the editable caption contents of one video, keeping caption
   * state in the store rather than duplicating it in React. Uploaded
   * caption blobs are kept only for captions whose language and content are
   * unchanged, so a stale blob can never be attached to edited caption text.
   * When the upload already ran (or is running), the task is cancelled and
   * restarted so the eager worker covers the new captions; a completed video
   * blob is reused by the caption-only retry path inside the worker.
   */
  function setVideoCaptions(
    postId: string,
    mediaId: string,
    captions: ReadonlyArray<{lang: string; content: string}>,
  ) {
    if (destroyed) return
    const post = state.posts[postId]
    if (!post) return
    const item = getMediaItems({media: post.attachments.media}).find(
      m => m.id === mediaId,
    )
    if (!item || item.kind !== 'video') return
    const nextCaptions = captions.map(caption => ({
      lang: caption.lang,
      content: caption.content,
    }))
    if (serializableEqual({left: item.captions, right: nextCaptions})) return

    const keptBlobs = item.captionBlobs.filter(blob => {
      const previous = item.captions.find(caption => caption.lang === blob.lang)
      if (!previous) return false
      return nextCaptions.some(
        next => next.lang === blob.lang && next.content === previous.content,
      )
    })
    const shouldRestart =
      item.upload.state === 'uploading' || item.upload.state === 'uploaded'
    if (shouldRestart) cancelUploadTask(mediaId)
    const next: types.PostMediaVideo = {
      ...item,
      captions: nextCaptions,
      captionBlobs: keptBlobs,
      upload: shouldRestart ? {state: 'pending'} : item.upload,
    }
    mutateState(s => {
      const currentPost = s.posts[postId]
      if (!currentPost) return null
      const items = getMediaItems({media: currentPost.attachments.media})
      if (!items.some(m => m.id === mediaId)) return null
      s.posts[postId] = replacePostMediaItems(
        currentPost,
        items.map(m => (m.id === mediaId ? next : m)),
      )
      s.isDirty = true
      return s
    })
    if (shouldRestart) startMediaUpload(postId, mediaId)
  }

  /** Regroup only selected items; record identity is unaffected. */
  function replacePostMediaItems(
    post: types.ThreadPost,
    items: types.PostMediaItem[],
  ): types.ThreadPost {
    const first = items[0]
    if (!first) return replacePostMedia(post, undefined)
    switch (first.kind) {
      case 'image':
        return replacePostMedia(post, {
          state: 'resolved',
          kind: 'images',
          items: items.filter(item => item.kind === 'image'),
        })
      case 'video':
      case 'gif':
        return replacePostMedia(
          post,
          first.kind === 'video'
            ? {state: 'resolved', kind: 'video', item: first}
            : {state: 'resolved', kind: 'gif', item: first},
        )
    }
  }

  /** All media replacements recompute selection capacity together. */
  function replacePostMedia(
    post: types.ThreadPost,
    media: types.MediaAttachment | undefined,
  ): types.ThreadPost {
    return {
      ...post,
      attachments: {...post.attachments, media},
      ...computePostMediaSelectionsRemaining({media}),
    }
  }

  /** Retries only currently retryable failures, never active or completed work. */
  function retryMediaUpload(postId: string, mediaId: string) {
    if (destroyed) return
    const post = state.posts[postId]
    if (!post) return
    const items = getMediaItems({media: post.attachments.media})
    const item = items.find(m => m.id === mediaId)
    if (!item || !isRetryableFailedUpload({item})) return

    cancelUploadTask(mediaId)
    const pending = {...item, upload: {state: 'pending' as const}}
    mutateState(s => {
      s.posts[postId] = replacePostMediaItems(
        post,
        items.map(m => (m.id === mediaId ? pending : m)),
      )
      return s
    })
    startMediaUpload(postId, mediaId)
  }

  /**
   * Retries each currently eligible failed image/video upload once in thread
   * order. Candidates are snapshotted before the first retry, then checked
   * against live state so reentrant subscribers cannot restart changed work.
   */
  function retryAllFailedUploads(): {retriedMediaIds: string[]} {
    if (destroyed) return {retriedMediaIds: []}

    const candidates: Array<{postId: string; mediaId: string}> = []
    for (const [postId, post] of Object.entries(state.posts)) {
      for (const item of getMediaItems({media: post.attachments.media})) {
        if (isRetryableFailedUpload({item})) {
          candidates.push({postId, mediaId: item.id})
        }
      }
    }

    const retriedMediaIds: string[] = []
    for (const {postId, mediaId} of candidates) {
      if (destroyed) break
      const post = state.posts[postId]
      const item = post
        ? getMediaItems({media: post.attachments.media}).find(
            media => media.id === mediaId,
          )
        : undefined
      if (!item || !isRetryableFailedUpload({item})) continue
      retryMediaUpload(postId, mediaId)
      retriedMediaIds.push(mediaId)
    }
    return {retriedMediaIds}
  }

  function startMediaUpload(postId: string, mediaId: string) {
    if (destroyed || uploadTasks.has(mediaId)) return
    const post = state.posts[postId]
    if (!post) return
    // Read live state: a subscriber may have edited, removed, or retried this item.
    const item = getMediaItems({media: post.attachments.media}).find(
      m => m.id === mediaId,
    )
    if (!item || item.kind === 'gif' || item.upload.state !== 'pending') return

    /*
     * Register ownership before invoking a worker. The real workers report
     * their first phase ('compressing' or 'validating') synchronously, before
     * their first await and before returning a handle. That report notifies
     * subscribers, so callbacks must not close over an uninitialised task, and
     * cancellation can be requested before `started` is assigned.
     */
    let started: UploadTask | undefined
    let cancelled = false
    const registered: UploadTask = {
      cancel() {
        cancelled = true
        started?.cancel()
      },
    }
    uploadTasks.set(item.id, registered)
    const callbacks = {
      postId,
      mediaId: item.id,
      pdsClient,
      pdsUrl,
      i18n,
      setUploadStatus: (
        p: string,
        m: string,
        status: types.UploadStatus,
        diagnostic?: {
          kind: 'validation' | 'operational' | 'unexpected'
          cause: unknown
        },
      ) => {
        if (uploadTasks.get(m) === registered)
          applyUploadStatus(p, m, status, diagnostic)
      },
      setMediaCompressionResult: (
        p: string,
        m: string,
        output: PreparedOutput,
      ) => {
        if (uploadTasks.get(m) === registered)
          applyMediaCompressionResult(p, m, output)
      },
      setCaptionBlobs: (
        p: string,
        m: string,
        captions: types.UploadedCaption[],
      ) => {
        if (uploadTasks.get(m) === registered) applyCaptionBlobs(p, m, captions)
      },
    }
    try {
      started =
        item.kind === 'image'
          ? (__uploadWorkers?.startImageUpload ?? startImageUpload)({
              ...callbacks,
              ...imageUploadDependencies,
              media: item,
            })
          : (__uploadWorkers?.startVideoUpload ?? startVideoUpload)({
              ...callbacks,
              ...videoUploadDependencies,
              media: item,
            })
      /*
       * A subscriber notified by that first report may remove the item or
       * destroy the store, cancelling `registered` while `started` is still
       * undefined. The ownership guards above already ignore the worker's
       * later reports, but only its own handle aborts it: without this, an
       * image would still be uploaded after compression and a video would go
       * on to compress and upload.
       */
      if (cancelled) started.cancel()
    } catch (cause) {
      if (!destroyed && uploadTasks.get(mediaId) === registered) {
        cancelUploadTask(mediaId)
        reportError(
          {
            source: 'upload',
            code: 'upload-start-failed',
            postId,
            mediaId,
            kind: 'unexpected',
            recovery: 'none',
          },
          cause,
        )
      }
      throw cause
    }
  }

  function cancelUploadTask(mediaId: string) {
    const task = uploadTasks.get(mediaId)
    uploadTasks.delete(mediaId)
    task?.cancel()
  }

  /** Upload progress does not dirty the draft or affect the record attachment. */
  function applyUploadStatus(
    postId: string,
    mediaId: string,
    input: types.UploadStatus,
    diagnostic?: {
      kind: 'validation' | 'operational' | 'unexpected'
      cause: unknown
    },
  ) {
    const post = state.posts[postId]
    if (destroyed || !post) return
    const found = getMediaItems({media: post.attachments.media}).find(
      item => item.id === mediaId,
    )
    if (!found || found.kind === 'gif') return
    if (input.state === 'failed') cancelUploadTask(mediaId)
    else if (input.state === 'uploaded') uploadTasks.delete(mediaId)
    const status: types.PostMediaUploadStatus =
      input.state === 'failed'
        ? input.retryable === false
          ? {...input, retryable: false}
          : {
              ...input,
              retryable: true,
              retry: () => {
                const current = getMediaItems({
                  media: state.posts[postId]?.attachments.media,
                }).find(item => item.id === mediaId)
                // A retained retry belongs to this failure, not a later attempt.
                if (
                  current &&
                  current.kind !== 'gif' &&
                  current.upload === status
                ) {
                  retryMediaUpload(postId, mediaId)
                }
              },
            }
        : input
    let accepted = false
    mutateState(s => {
      const currentPost = s.posts[postId]
      if (!currentPost) return null
      const currentItems = getMediaItems({media: currentPost.attachments.media})
      const current = currentItems.find(item => item.id === mediaId)
      if (!current || current.kind === 'gif') return null
      const next =
        current.kind === 'video'
          ? {
              ...current,
              videoBlob:
                input.state === 'uploaded' || input.state === 'failed'
                  ? (input.blob ?? current.videoBlob)
                  : current.videoBlob,
              captionBlobs:
                input.state === 'uploaded' || input.state === 'failed'
                  ? (input.captionBlobs ?? current.captionBlobs)
                  : current.captionBlobs,
              upload: status,
            }
          : {...current, upload: status}
      s.posts[postId] = replacePostMediaItems(currentPost, [
        ...currentItems.map(item => (item.id === mediaId ? next : item)),
      ])
      accepted = true
      return s
    })
    if (
      accepted &&
      input.state === 'failed' &&
      found.upload.state !== 'failed'
    ) {
      reportError(
        {
          source: 'upload',
          code: input.code ?? 'upload-failed',
          postId,
          mediaId,
          kind:
            diagnostic?.kind ??
            (input.retryable === false ? 'validation' : 'operational'),
          recovery: input.retryable === false ? 'edit' : 'retry',
        },
        diagnostic?.cause,
      )
    }
  }

  /**
   * Store the local compression result as `item.prepared` without replacing
   * the original media source. The planner prefers these dimensions when
   * building the embed. This does not mark the upload complete; the uploaded
   * blob is recorded separately through upload status.
   */
  function applyMediaCompressionResult(
    postId: string,
    mediaId: string,
    output: PreparedOutput,
  ) {
    const post = state.posts[postId]
    if (!post) return
    const items = getMediaItems({media: post.attachments.media})
    const found = items.find(item => item.id === mediaId)
    if (!found || found.kind !== output.kind) return
    mutateState(s => {
      const current = getMediaItems({
        media: s.posts[postId]?.attachments.media,
      }).find(item => item.id === mediaId)
      if (!current || current.kind !== output.kind) return null
      const next = {
        ...current,
        prepared: output,
      } as types.PostMediaItem
      const currentItems = getMediaItems({
        media: s.posts[postId].attachments.media,
      })
      s.posts[postId] = replacePostMediaItems(
        s.posts[postId],
        currentItems.map(item => (item.id === mediaId ? next : item)),
      )
      return s
    })
  }

  function applyCaptionBlobs(
    postId: string,
    mediaId: string,
    captions: types.UploadedCaption[],
  ) {
    const post = state.posts[postId]
    if (!post) return
    const items = getMediaItems({media: post.attachments.media})
    const found = items.find(item => item.id === mediaId)
    if (!found || found.kind !== 'video') return
    mutateState(s => {
      const current = getMediaItems({
        media: s.posts[postId]?.attachments.media,
      }).find(item => item.id === mediaId)
      if (!current || current.kind !== 'video') return null
      const currentItems = getMediaItems({
        media: s.posts[postId].attachments.media,
      })
      s.posts[postId] = replacePostMediaItems(
        s.posts[postId],
        currentItems.map(item =>
          item.id === mediaId
            ? {
                ...current,
                captionBlobs: captions.map(caption => ({...caption})),
              }
            : item,
        ),
      )
      return s
    })
  }

  /**
   * Reserve the record or media slot before resolving a URL. Settled values
   * block new candidates; pending/failed candidates can be superseded.
   */
  function addUri(postId: string, uri: string) {
    if (destroyed) return
    const target = classifyUriTarget({uri})
    const post = state.posts[postId]
    if (!post || post.attachments[target]?.state === 'resolved') return
    const rev = resolutionRevs[target].incrementFor({key: postId})
    mutateState(s => {
      const currentPost = s.posts[postId]
      if (
        !currentPost ||
        currentPost.attachments[target]?.state === 'resolved'
      ) {
        return null
      }
      if (target === 'record') {
        s.posts[postId] = replaceRecordAttachment(currentPost, {
          state: 'pending',
          uri,
        })
      } else {
        s.posts[postId] = replacePostMedia(currentPost, {state: 'pending', uri})
      }
      s.isDirty = true
      return s
    })
    resolveAttachmentUri({postId, target, uri, rev})
  }

  /**
   * Resolve one reserved destination. Completion and retry handlers close over
   * this attempt's destination, revision, post, and URI so stale work can
   * never be redirected into the other attachment slot.
   */
  function resolveAttachmentUri({
    postId,
    target,
    uri,
    rev,
  }: {
    postId: string
    target: AttachmentSlot
    uri: string
    rev: number
  }) {
    if (destroyed || !resolutionRevs[target].isCurrentFor({key: postId, rev}))
      return

    const applyFailed = (err: unknown, unexpected = false) => {
      if (destroyed || !resolutionRevs[target].isCurrentFor({key: postId, rev}))
        return
      if (isComposerV2Cancellation({cause: err})) return
      const {code, isRetryable} = parseResolveLinkError({error: err})
      const retry = isRetryable
        ? () => {
            if (
              destroyed ||
              !resolutionRevs[target].isCurrentFor({key: postId, rev})
            ) {
              return
            }
            const retryRev = resolutionRevs[target].incrementFor({key: postId})
            mutateState(retryState => {
              const currentPost = retryState.posts[postId]
              if (!currentPost) return null
              if (target === 'record') {
                retryState.posts[postId] = replaceRecordAttachment(
                  currentPost,
                  {
                    state: 'pending',
                    uri,
                  },
                )
              } else {
                retryState.posts[postId] = replacePostMedia(currentPost, {
                  state: 'pending',
                  uri,
                })
              }
              return retryState
            })
            resolveAttachmentUri({postId, target, uri, rev: retryRev})
          }
        : undefined
      const failure = {
        state: 'failed' as const,
        uri,
        // The UI localizes this stable code; raw diagnostics never enter state.
        error:
          code === 'embedding-disabled'
            ? 'Embedding disabled'
            : 'Link resolution failed',
        code,
        retry,
      }
      let accepted = false
      mutateState(s => {
        const post = s.posts[postId]
        if (!post) return null
        s.posts[postId] =
          target === 'record'
            ? replaceRecordAttachment(post, failure)
            : replacePostMedia(post, failure)
        accepted = true
        return s
      })
      if (!accepted) return
      reportError(
        {
          source: 'uri-resolution',
          code,
          slot: target,
          postId,
          kind: unexpected
            ? 'unexpected'
            : isRetryable
              ? 'operational'
              : 'validation',
          recovery: isRetryable ? 'retry' : 'edit',
        },
        err,
      )
    }

    const applyResolved = (link: ResolvedLink) => {
      if (
        destroyed ||
        !resolutionRevs[target].isCurrentFor({key: postId, rev})
      ) {
        return
      }
      if ((link.type === 'record') !== (target === 'record')) {
        applyFailed(new Error('Unexpected attachment type'), true)
        return
      }
      mutateState(s => {
        const post = s.posts[postId]
        if (!post) return null
        if (link.type === 'record') {
          const {type: _type, ...record} = link
          s.posts[postId] = replaceRecordAttachment(post, {
            state: 'resolved',
            ...record,
          })
        } else if (link.type === 'external') {
          const {type: _type, ...external} = link
          s.posts[postId] = replacePostMedia(post, {
            state: 'resolved',
            kind: 'external',
            ...external,
          })
        } else {
          const {type: _type, ...invite} = link
          s.posts[postId] = replacePostMedia(post, {
            state: 'resolved',
            kind: 'chat-invite',
            ...invite,
          })
        }
        return s
      })
    }

    try {
      resolve(resolvers, uri).then(applyResolved, applyFailed)
    } catch (cause) {
      applyFailed(cause, true)
    }
  }

  /** Direct insertion of a known record replaces only the record slot. */
  function setRecordAttachment(
    postId: string,
    value: types.RecordAttachmentValue,
  ) {
    if (destroyed || !state.posts[postId]) return
    resolutionRevs.record.incrementFor({key: postId})
    mutateState(s => {
      s.posts[postId] = replaceRecordAttachment(s.posts[postId], {
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
      resolutionRevs.record.incrementFor({key: postId})
      s.posts[postId] = replaceRecordAttachment(post, undefined)
      s.isDirty = true
      return s
    })
  }

  /**
   * Return a copy of the post with its record attachment slot (post, feed,
   * list, or starter pack, in any resolution state) replaced, or cleared when
   * `record` is undefined.
   */
  function replaceRecordAttachment(
    post: types.ThreadPost,
    record: types.RecordAttachment | undefined,
  ): types.ThreadPost {
    return {...post, attachments: {...post.attachments, record}}
  }

  function destroy() {
    destroyed = true
    for (const task of uploadTasks.values()) task.cancel()
    uploadTasks.clear()
    resolutionRevs.record.clearAll()
    resolutionRevs.media.clearAll()
    listeners.clear()
  }

  /*
   * The initial state is now complete, so start its side effects: eager
   * uploads for initial media and resolution of pending URI attachments.
   * This waits until the whole snapshot exists because workers may call back
   * synchronously (the real workers report their first phase before
   * returning), and those callbacks must find every post and item in place.
   */
  try {
    for (const [postId, post] of Object.entries(state.posts)) {
      for (const item of getMediaItems({media: post.attachments.media})) {
        startMediaUpload(postId, item.id)
      }
      for (const slot of ['record', 'media'] as const) {
        const attachment = post.attachments[slot]
        if (attachment?.state === 'pending') {
          const rev = resolutionRevs[slot].incrementFor({key: postId})
          resolveAttachmentUri({
            postId,
            target: slot,
            uri: attachment.uri,
            rev,
          })
        }
      }
    }
  } catch (cause) {
    /*
     * Only synchronous exceptions escaping startup land here, in practice a
     * worker that throws while starting (startMediaUpload has already
     * reported it). Resolver throws, promise rejections, and ordinary upload
     * failures are handled as attachment state by the workers and resolvers
     * and never fail construction.
     *
     * A failed constructor returns no store for the caller to destroy, so
     * tear down here: started upload tasks are cancelled, pending resolutions
     * are invalidated so late results are ignored, and the store goes inert.
     * Cancellation is best effort; compression or requests already in flight
     * may still finish, but their results are discarded. Then rethrow the
     * original error.
     */
    destroy()
    throw cause
  }

  return {
    /** Share the session's policy with callers; inert after destruction. */
    reportError,
    /** User-facing composer commands for editing a thread. */
    actions: {
      setPostText,
      setPostLanguages,
      setPostLabels,
      setPostTags,
      setThreadgateAllowRules,
      setPostgateConfiguration,
      setPostgateEmbeddingRules,
      addPost,
      movePost,
      removePost,
      addMedia,
      removeMedia,
      removeMediaAttachment,
      updateMediaAltText,
      setVideoCaptions,
      retryMediaUpload,
      retryAllFailedUploads,
      addUri,
      setRecordAttachment,
      removeRecordAttachment,
    },
    /**
     * Internal/test seam for exercising upload state transitions. UI callers
     * must use the upload workers rather than mutating status directly.
     */
    internalActions: {
      setUploadStatus: applyUploadStatus,
    },
    destroy,
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
