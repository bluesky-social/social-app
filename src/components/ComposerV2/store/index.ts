import {type BlobRef} from '@atproto/lex'
import deepEqual from 'fast-deep-equal'
import {nanoid} from 'nanoid/non-secure'

import {
  type LinkResolvers,
  type ResolvedLink,
  resolveLink as importedResolveLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {
  type VideoAbandonReason,
  type VideoRestartReason,
} from '#/lib/media/video/types'
import {
  type ComposerV2OnError,
  isComposerV2Cancellation,
  reportComposerV2Error,
} from '#/components/ComposerV2/errors'
import {
  createMediaUploads,
  type MediaUploadUpdate,
} from '#/components/ComposerV2/store/mediaUploads'
import type * as types from '#/components/ComposerV2/store/types'
import {type UploadWorkerOverrides} from '#/components/ComposerV2/store/uploads'
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
import {validDimensions} from '#/components/ComposerV2/store/utils/validDimensions'
import {type AnalyticsContextType} from '#/analytics'

function isRetryableFailedUpload({item}: {item: types.PostMediaItem}): boolean {
  if (item.kind !== 'image' && item.kind !== 'video') return false
  return item.upload.state === 'failed' && item.upload.retryable
}

/** One isolated thread composition session, independent of React. */
export function createThreadStore({
  resolvers,
  pdsClient,
  pdsUrl,
  i18n,
  analytics,
  initialState,
  onError,
  __createId,
  __resolveLink,
  __uploadWorkers,
}: types.UploadRuntime & {
  resolvers: LinkResolvers
  /** The session's analytics: metrics now, and feature gates as needed. */
  analytics: AnalyticsContextType
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
  /**
   * A report raised while `onError` is running is dropped, so a policy
   * callback that calls back into the store cannot recurse.
   */
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

  const uploads = createMediaUploads({
    pdsClient,
    pdsUrl,
    i18n,
    metric: analytics.metric,
    onUpdate: applyMediaUploadUpdate,
    __uploadWorkers,
  })
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
      if (deepEqual(post.langs, languages)) return null
      s.posts[postId] = {...post, langs: [...languages]}
      s.isDirty = true
      return s
    })
  }

  function setPostLabels(postId: string, labels: string[]) {
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      if (deepEqual(post.labels, labels)) return null
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
      if (deepEqual(post.tags, tags)) return null
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
      if (deepEqual(s.threadgateAllowRules, allow)) return null
      s.threadgateAllowRules = allow?.map(rule =>
        cloneSerializable({value: rule}),
      )
      s.isDirty = true
      return s
    })
  }

  function setPostgateEmbeddingRules(
    embeddingRules: readonly types.PostgateEmbeddingRule[],
  ) {
    mutateState(s => {
      if (deepEqual(s.postgateEmbeddingRules, embeddingRules)) return null
      s.postgateEmbeddingRules = embeddingRules.map(rule =>
        cloneSerializable({value: rule}),
      )
      s.isDirty = true
      return s
    })
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
        uploads.forget({mediaId: item.id, abandoned: 'removed'})
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
      uploads.forget({mediaId, abandoned: 'removed'})
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
        uploads.forget({mediaId: item.id, abandoned: 'removed'})
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
    updateMediaItem({
      postId,
      mediaId,
      dirty: true,
      update: item => (item.altText === altText ? null : {...item, altText}),
    })
  }

  /**
   * Swaps an image's current source for an editor's output, for example a
   * crop. The first replace keeps the previous source as `original`, so later
   * edits crop from it and replace only the edited result; with `undefined`,
   * the item returns to `original` and drops it. Alt text, id, and position
   * stay. Every current-source field is overwritten, so values the new source
   * omits become unknown and the worker resolves them again.
   *
   * The upload restarts from the new source: the running task is cancelled
   * (its late results are discarded by the task-identity guard), and any
   * prepared output or uploaded blob is dropped so a publish cannot use bytes
   * from before the edit.
   *
   * Returns `{supersededUri}` when an earlier edited source was discarded,
   * for the caller to clean up; the store never deletes or revokes it, nor the
   * original. Returns `undefined` when the item is not a live image. Replacing
   * with the current URI, or resetting an unedited item, changes nothing.
   * Passing the original's own URI is a reset.
   */
  function replaceImageSource(
    postId: string,
    mediaId: string,
    source: types.PostMediaImageSource | undefined,
  ): {supersededUri?: string} | undefined {
    if (destroyed) return undefined
    const post = state.posts[postId]
    if (!post) return undefined
    const items = getMediaItems({media: post.attachments.media})
    const item = items.find(m => m.id === mediaId)
    if (!item || item.kind !== 'image') return undefined

    /* Handing back the original's own URI is a reset, not a second edit. */
    const reset = !source || source.uri === item.original?.uri
    const next = reset ? item.original : source
    if (!next || next.uri === item.uri) return {}

    /* With an original kept, the current source is an edited result. */
    const supersededUri = item.original ? item.uri : undefined
    const original = reset
      ? undefined
      : (item.original ?? {
          uri: item.uri,
          width: item.width,
          height: item.height,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
        })
    const replaced: types.PostMediaImage = {
      kind: 'image',
      id: item.id,
      postId: item.postId,
      uri: next.uri,
      width: next.width,
      height: next.height,
      altText: item.altText,
      mimeType: next.mimeType,
      fileSize: next.fileSize,
      original,
      localRefPath: item.localRefPath,
      upload: {state: 'pending'},
    }

    uploads.cancel({mediaId})
    updateMediaItem({postId, mediaId, dirty: true, update: () => replaced})
    startMediaUpload(postId, mediaId)
    return {supersededUri}
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
    if (deepEqual(item.captions, nextCaptions)) return

    const keptBlobs = item.captionBlobs.filter(blob => {
      const previous = item.captions.find(caption => caption.lang === blob.lang)
      if (!previous) return false
      return nextCaptions.some(
        next => next.lang === blob.lang && next.content === previous.content,
      )
    })
    const shouldRestart =
      item.upload.state === 'uploading' || item.upload.state === 'uploaded'
    if (shouldRestart) uploads.cancel({mediaId})
    const next: types.PostMediaVideo = {
      ...item,
      captions: nextCaptions,
      captionBlobs: keptBlobs,
      upload: shouldRestart ? {state: 'pending'} : item.upload,
    }
    updateMediaItem({postId, mediaId, dirty: true, update: () => next})
    if (shouldRestart) startMediaUpload(postId, mediaId, 'captions')
  }

  /**
   * Replace one live media item. Reads the item inside mutateState, so callers
   * never act on a stale lookup. Publishes nothing when the post or item is
   * gone or `update` returns null. Returns whether a change was published.
   */
  function updateMediaItem({
    postId,
    mediaId,
    dirty = false,
    update,
  }: {
    postId: string
    mediaId: string
    /** Mark the draft dirty (user edits); background progress passes false. */
    dirty?: boolean
    update: (item: types.PostMediaItem) => types.PostMediaItem | null
  }): boolean {
    let published = false
    mutateState(s => {
      const post = s.posts[postId]
      if (!post) return null
      const items = getMediaItems({media: post.attachments.media})
      const current = items.find(item => item.id === mediaId)
      if (!current) return null
      const next = update(current)
      if (!next) return null
      s.posts[postId] = replacePostMediaItems(
        post,
        items.map(item => (item.id === mediaId ? next : item)),
      )
      if (dirty) s.isDirty = true
      published = true
      return s
    })
    return published
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

    uploads.cancel({mediaId})
    const pending = {...item, upload: {state: 'pending' as const}}
    updateMediaItem({postId, mediaId, update: () => pending})
    startMediaUpload(postId, mediaId, 'retry')
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

  function startMediaUpload(
    postId: string,
    mediaId: string,
    restartReason?: VideoRestartReason,
  ) {
    if (destroyed) return
    const post = state.posts[postId]
    if (!post) return
    // Read live state: a subscriber may have edited, removed, or retried this item.
    const item = getMediaItems({media: post.attachments.media}).find(
      m => m.id === mediaId,
    )
    if (!item || item.kind === 'gif' || item.upload.state !== 'pending') return
    uploads.start({postId, item, restartReason})
  }

  /** Routes what a current upload attempt reports into state and error policy. */
  function applyMediaUploadUpdate(update: MediaUploadUpdate) {
    const {postId, mediaId} = update
    switch (update.type) {
      case 'status':
        applyUploadStatus({postId, mediaId, status: update.status})
        break
      case 'failure':
        applyUploadFailure({
          postId,
          mediaId,
          status: update.status,
          diagnostic: update.diagnostic,
        })
        break
      case 'source-metadata':
        applyMediaSourceMetadata(postId, mediaId, update.metadata)
        break
      case 'image-compression-result':
        applyImageCompressionResult(postId, mediaId, update.prepared)
        break
      case 'video-compression-result':
        applyVideoCompressionResult(postId, mediaId, update.prepared)
        break
      case 'caption-blobs':
        applyCaptionBlobs(postId, mediaId, update.captions)
        break
      case 'video-blob':
        applyVideoBlob(postId, mediaId, update.blob)
        break
      case 'start-failed':
        reportError(
          {
            source: 'upload',
            code: 'upload-start-failed',
            postId,
            mediaId,
            kind: 'unexpected',
            recovery: 'none',
          },
          update.cause,
        )
        break
    }
  }

  /** Upload progress does not dirty the draft or affect the record attachment. */
  function applyUploadStatus({
    postId,
    mediaId,
    status,
  }: {
    postId: string
    mediaId: string
    status: Exclude<types.UploadStatus, {state: 'failed'}>
  }) {
    if (!findUploadableItem({postId, mediaId})) return
    writeUploadStatus({postId, mediaId, status})
  }

  /** Reports the diagnostic the worker classified, once per new failure. */
  function applyUploadFailure({
    postId,
    mediaId,
    status,
    diagnostic,
  }: {
    postId: string
    mediaId: string
    status: Extract<types.UploadStatus, {state: 'failed'}>
    diagnostic: types.UploadDiagnostic
  }) {
    const found = findUploadableItem({postId, mediaId})
    if (!found) return
    const accepted = writeUploadStatus({postId, mediaId, status})
    if (accepted && found.upload.state !== 'failed') {
      reportError(
        {
          source: 'upload',
          code: status.code ?? 'upload-failed',
          postId,
          mediaId,
          kind: diagnostic.kind,
          recovery: status.retryable ? 'retry' : 'edit',
        },
        diagnostic.cause,
      )
    }
  }

  /** The live image or video item, or undefined once it, its post, or the store is gone. */
  function findUploadableItem({
    postId,
    mediaId,
  }: {
    postId: string
    mediaId: string
  }) {
    const post = state.posts[postId]
    if (destroyed || !post) return undefined
    const found = getMediaItems({media: post.attachments.media}).find(
      item => item.id === mediaId,
    )
    return found?.kind === 'gif' ? undefined : found
  }

  /** Publishes the status; false when the item no longer exists. */
  function writeUploadStatus({
    postId,
    mediaId,
    status,
  }: {
    postId: string
    mediaId: string
    status: types.UploadStatus
  }) {
    return updateMediaItem({
      postId,
      mediaId,
      update: current => {
        if (current.kind === 'gif') return null
        if (current.kind === 'image') return {...current, upload: status}
        return {
          ...current,
          videoBlob:
            status.state === 'uploaded' || status.state === 'failed'
              ? (status.blob ?? current.videoBlob)
              : current.videoBlob,
          captionBlobs:
            status.state === 'uploaded' || status.state === 'failed'
              ? (status.captionBlobs ?? current.captionBlobs)
              : current.captionBlobs,
          upload: status,
        }
      },
    })
  }

  /**
   * Keep a processed video blob on the item while its captions upload, so a
   * caption edit then restarts from it. The upload stays in progress: only the
   * worker reports completion, after captions.
   */
  function applyVideoBlob(postId: string, mediaId: string, blob: BlobRef) {
    updateMediaItem({
      postId,
      mediaId,
      update: current =>
        current.kind === 'video' ? {...current, videoBlob: blob} : null,
    })
  }

  /**
   * Store the local compression result as `item.prepared` without replacing
   * the original media source. The planner prefers these dimensions when
   * building the embed. Image dimensions are the compressor's output. This
   * does not mark the upload complete; the uploaded blob is recorded
   * separately through upload status.
   */
  function applyImageCompressionResult(
    postId: string,
    mediaId: string,
    prepared: types.PreparedImage,
  ) {
    updateMediaItem({
      postId,
      mediaId,
      update: current =>
        current.kind === 'image' ? {...current, prepared} : null,
    })
  }

  /**
   * Like `applyImageCompressionResult`; video `width`, `height`, and
   * `aspectRatio` are the source's (see `PreparedVideo`).
   */
  function applyVideoCompressionResult(
    postId: string,
    mediaId: string,
    prepared: types.PreparedVideo,
  ) {
    updateMediaItem({
      postId,
      mediaId,
      update: current =>
        current.kind === 'video' ? {...current, prepared} : null,
    })
  }

  /**
   * Record the source metadata a worker prepared. It only fills values the
   * current source did not know (`replaceImageSource` resets them with the
   * source it swaps in) and publishes nothing when there is nothing new.
   * Background preparation does not dirty drafts.
   */
  function applyMediaSourceMetadata(
    postId: string,
    mediaId: string,
    metadata: types.ResolvedSourceMetadata,
  ) {
    updateMediaItem({
      postId,
      mediaId,
      update: current => {
        if (current.kind === 'gif') return null
        const next = {...current}
        if (!validDimensions(current) && validDimensions(metadata)) {
          next.width = metadata.width
          next.height = metadata.height
        }
        next.mimeType ??= metadata.mimeType
        next.fileSize ??= metadata.fileSize
        if (next.kind === 'video') next.duration ??= metadata.duration
        if (
          next.width === current.width &&
          next.height === current.height &&
          next.mimeType === current.mimeType &&
          next.fileSize === current.fileSize &&
          (next.kind !== 'video' ||
            current.kind !== 'video' ||
            next.duration === current.duration)
        ) {
          return null
        }
        return next
      },
    })
  }

  function applyCaptionBlobs(
    postId: string,
    mediaId: string,
    captions: types.UploadedCaption[],
  ) {
    updateMediaItem({
      postId,
      mediaId,
      update: current =>
        current.kind === 'video'
          ? {...current, captionBlobs: captions.map(caption => ({...caption}))}
          : null,
    })
  }

  /**
   * Re-resolve a failed link with the same URI. Only a live, retryable failed
   * slot qualifies. Stale results are dropped before they apply, so a failed
   * slot in live state always belongs to the latest revision. Like the
   * original failure, it does not dirty the draft.
   */
  function retryAttachment(postId: string, slot: AttachmentSlot) {
    if (destroyed) return
    const post = state.posts[postId]
    const current = post?.attachments[slot]
    if (!post || current?.state !== 'failed' || !current.retryable) return
    const {uri} = current
    const rev = resolutionRevs[slot].incrementFor({key: postId})
    mutateState(s => {
      const currentPost = s.posts[postId]
      if (!currentPost) return null
      s.posts[postId] =
        slot === 'record'
          ? replaceRecordAttachment(currentPost, {state: 'pending', uri})
          : replacePostMedia(currentPost, {state: 'pending', uri})
      return s
    })
    resolveAttachmentUri({postId, target: slot, uri, rev})
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
   * Resolve one reserved destination. Completion handlers close over this
   * attempt's destination, revision, post, and URI so stale work can never be
   * redirected into the other attachment slot.
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
      const failure = {
        state: 'failed' as const,
        uri,
        // The UI localizes this stable code; raw diagnostics never enter state.
        error:
          code === 'embedding-disabled'
            ? 'Embedding disabled'
            : 'Link resolution failed',
        code,
        retryable: isRetryable,
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

  /** Closing the composer; in-flight video uploads report abandonment. */
  function destroy() {
    teardown({abandoned: 'closed'})
  }

  function teardown(options: {abandoned?: VideoAbandonReason}) {
    destroyed = true
    uploads.destroy(options)
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
     * original error. The user closed nothing, so nothing is abandoned.
     */
    teardown({})
    throw cause
  }

  return {
    /** Share the session's policy with callers; inert after destruction. */
    reportError,
    reportPublished: uploads.reportPublished,
    reportPublishUncertain: uploads.reportPublishUncertain,
    /** User-facing composer commands for editing a thread. */
    actions: {
      setPostText,
      setPostLanguages,
      setPostLabels,
      setPostTags,
      setThreadgateAllowRules,
      setPostgateEmbeddingRules,
      addPost,
      movePost,
      removePost,
      addMedia,
      removeMedia,
      removeMediaAttachment,
      updateMediaAltText,
      replaceImageSource,
      setVideoCaptions,
      retryMediaUpload,
      retryAllFailedUploads,
      retryAttachment,
      addUri,
      setRecordAttachment,
      removeRecordAttachment,
    },
    /**
     * Internal/test seam for exercising upload state transitions. UI callers
     * must use the upload workers rather than mutating status directly.
     */
    internalActions: {
      applyUploadStatus,
      applyUploadFailure,
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
