import {type ImagePickerAsset} from 'expo-image-picker'
import {type BlobRef, type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {AbortError} from '#/lib/async/cancelable'
import {
  IMAGE_SIZE_CONFIG_POSTS,
  SUPPORTED_MIME_TYPES,
  VIDEO_MAX_DURATION_MS,
  VIDEO_MAX_SIZE,
} from '#/lib/constants'
import {UploadLimitError, VideoTooLargeError} from '#/lib/media/video/errors'
import {errorClass, type VideoTelemetry} from '#/lib/media/video/telemetry'
import {
  type CompressedVideo,
  type VideoAbandonReason,
  type VideoRestartReason,
  type VideoValidationFailure,
} from '#/lib/media/video/types'
import {isNetworkError, shouldRetryError} from '#/lib/strings/errors'
import {type ComposerImage} from '#/state/gallery'
import {type AnalyticsContextType} from '#/analytics'
import {IS_ANDROID, IS_WEB} from '#/env'
import {app} from '#/lexicons'
import {prepareImageSource, prepareVideoSource} from './prepareMediaSource'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type ResolvedSourceMetadata,
  type UploadedCaption,
  type UploadStatus,
} from './types'

/** Runtime handle owned by the store, never published in ThreadState. */
export type UploadTask = {
  /**
   * `abandoned` marks a user giving up on the media, which video telemetry
   * reports: `'removed'` for removing it or its post, `'closed'` for closing
   * the composer. Other cancellations, such as a caption restart or retry,
   * are silent.
   */
  cancel(options?: {abandoned?: VideoAbandonReason}): void
}

/** Test-only worker seam; production uses the real workers below. */
export type UploadWorkerOverrides = {
  startImageUpload?: (opts: ImageOptions) => UploadTask
  startVideoUpload?: (opts: VideoOptions) => UploadTask
}

type SetStatus = (
  postId: string,
  mediaId: string,
  status: UploadStatus,
  diagnostic?: {
    kind: 'validation' | 'operational' | 'unexpected'
    cause: unknown
  },
) => void

export type PreparedOutput =
  | {
      kind: 'image'
      uri: string
      width: number
      height: number
      mimeType: string
      aspectRatio: {width: number; height: number}
      size?: number
    }
  | {
      kind: 'video'
      uri: string
      size: number
      mimeType: string
      width: number
      height: number
      aspectRatio: {width: number; height: number}
    }

/** Account-scoped inputs every real upload needs. */
export type UploadRuntime = {
  pdsClient: Client
  /**
   * The account's PDS URL. Video uploads derive the service-auth audience for
   * `com.atproto.repo.uploadBlob` from it; the lex client does not expose it.
   */
  pdsUrl: string
  i18n: I18n
}

/*
 * Workers call these implementations directly. createThreadStore supplies the
 * production versions; tests pass fakes by calling a worker themselves or
 * through `__uploadWorkers`. A worker never chooses an implementation.
 */
type UploadBlob = (typeof import('#/lib/api/upload-blob'))['uploadBlob']
/** Reads dimensions from a native file URI or a web data/object URL. */
type GetImageDimensions = (typeof import('#/lib/media/manip'))['getImageDim']

/** Implementations the image worker calls. */
export type ImageUploadDependencies = {
  /** Called only when the item does not already know its dimensions. */
  getImageDimensions: GetImageDimensions
  compressImage: (typeof import('#/lib/media/image/compress'))['compressImage']
  uploadBlob: UploadBlob
}

/** Implementations the video worker calls, including caption blob uploads. */
export type VideoUploadDependencies = {
  /** Called only for non-GIF sources still missing metadata. */
  getVideoMetadata: (typeof import('#/view/com/composer/videos/metadata'))['getVideoMetadata']
  /** GIF dimensions; GIFs never reach the video metadata probe. */
  getImageDimensions: GetImageDimensions
  /** Native file stat for a source whose size is unknown; unused on web. */
  getFileSize: (typeof import('#/lib/media/uriSize'))['getUriSize']
  /** One instance per compression attempt; see `runVideoUpload`. */
  createVideoTelemetry: (typeof import('#/lib/media/video/telemetry'))['createVideoTelemetry']
  /**
   * Android only: a readable copy of a restored draft video, owned by one
   * worker attempt. See `needsReadableCopy`.
   */
  copyVideoToCache: (typeof import('./utils/copyVideoToCache'))['copyVideoToCache']
  compressVideo: (typeof import('#/lib/media/video/compress'))['compressVideo']
  uploadVideo: (typeof import('#/lib/media/video/upload'))['uploadVideo']
  /** Caption blobs go to the account PDS. */
  uploadBlob: UploadBlob
  createVideoServiceClient: (typeof import('#/lib/media/video/util'))['createTokenlessVideoServiceClient']
  /** Waits between processing polls; rejects with AbortError on cancellation. */
  sleep: (args: {ms: number; signal: AbortSignal}) => Promise<void>
}

/** Delay between video processing status polls. */
const VIDEO_JOB_POLL_INTERVAL_MS = 1500

type BaseOptions = UploadRuntime & {
  postId: string
  mediaId: string
  setUploadStatus: SetStatus
  /**
   * Called after local compression, before the upload starts. Records the
   * compressed output alongside the original source; it does not mark the
   * upload complete.
   */
  setMediaCompressionResult?: (
    postId: string,
    mediaId: string,
    output: PreparedOutput,
  ) => void
  /**
   * Called with the prepared source metadata. The store keeps what the item
   * did not know, so a retry of the same item does not read the source again.
   */
  setMediaSourceMetadata?: (
    postId: string,
    mediaId: string,
    metadata: ResolvedSourceMetadata,
  ) => void
  setCaptionBlobs?: (
    postId: string,
    mediaId: string,
    captions: UploadedCaption[],
  ) => void
}

type ImageOptions = BaseOptions &
  ImageUploadDependencies & {media: PostMediaImage}
type VideoOptions = BaseOptions &
  VideoUploadDependencies & {
    media: PostMediaVideo
    /** The session's analytics sink for video upload telemetry. */
    metric: AnalyticsContextType['metric']
    /** Set when this attempt replaces an earlier one for the same video. */
    restart?: {reason: VideoRestartReason; previousUploadId?: string}
    /**
     * The telemetry of the attempt that uploaded `media.videoBlob`, so a
     * caption-only retry reports caption failures against that upload.
     */
    uploadedVideoTelemetry?: VideoTelemetry
    /**
     * Called when the attempt creates its telemetry, and again with the blob
     * once the video is uploaded, so the store can link restarts and report
     * publication through the same instance.
     */
    setVideoTelemetry?: (
      postId: string,
      mediaId: string,
      video: {telemetry: VideoTelemetry; blob?: BlobRef},
    ) => void
  }

/** Start the image compression and PDS upload pipeline. */
export function startImageUpload(opts: ImageOptions): UploadTask {
  const controller = new AbortController()
  void runImageUpload({...opts, signal: controller.signal})
  return {cancel: () => controller.abort()}
}

/** Start compression, multipart upload, processing polling, and caption uploads. */
export function startVideoUpload(opts: VideoOptions): UploadTask {
  const controller = new AbortController()
  const abandonment = new AbortController()
  void runVideoUpload({
    ...opts,
    signal: controller.signal,
    abandonmentSignal: abandonment.signal,
  })
  return {
    cancel: ({abandoned} = {}) => {
      /* Telemetry records the phase it was in, so abandon first. */
      if (abandoned) abandonment.abort(abandoned)
      controller.abort()
    },
  }
}

async function runImageUpload({
  signal,
  ...opts
}: ImageOptions & {signal: AbortSignal}) {
  const {
    media,
    pdsClient,
    i18n,
    getImageDimensions,
    compressImage,
    uploadBlob,
  } = opts
  try {
    report({...opts, status: {state: 'uploading', phase: 'compressing'}})

    /*
     * Neither the dimension read nor compressImage has a cancellation hook.
     * Cancellation is therefore logical here: late results are ignored and no
     * later step starts after abort.
     */
    const {source, metadata} = await prepareImageSource({
      media,
      getImageDimensions,
    })
    throwIfAborted({signal})
    opts.setMediaSourceMetadata?.(opts.postId, opts.mediaId, metadata)
    if (!validDimensions(source)) {
      throw new ValidationError('invalid-image-dimensions')
    }
    const image: ComposerImage = {
      alt: media.altText,
      source: {
        id: media.id,
        path: source.uri,
        width: source.width,
        height: source.height,
        /* compressImage always re-encodes and does not read the source type. */
        mime: source.mimeType ?? 'image/jpeg',
      },
    }
    const compressed = await compressImage({image, ...IMAGE_SIZE_CONFIG_POSTS})
    throwIfAborted({signal})
    const prepared = {
      kind: 'image' as const,
      uri: compressed.path,
      width: compressed.width,
      height: compressed.height,
      mimeType: compressed.mime,
      aspectRatio: {width: compressed.width, height: compressed.height},
      size: compressed.size,
    }
    opts.setMediaCompressionResult?.(opts.postId, opts.mediaId, prepared)
    report({...opts, status: {state: 'uploading', phase: 'uploading'}})
    const result = await uploadBlob(pdsClient, compressed.path, compressed.mime)
    throwIfAborted({signal})
    report({...opts, status: {state: 'uploaded', blob: result.blob}})
  } catch (error) {
    if (isAborted({error, signal})) return
    reportFailure({
      ...opts,
      status: failureStatus({error, i18n, kind: 'image'}),
      cause: error,
    })
  }
}

async function runVideoUpload({
  signal,
  abandonmentSignal,
  ...opts
}: VideoOptions & {signal: AbortSignal; abandonmentSignal: AbortSignal}) {
  const {
    media,
    pdsClient,
    pdsUrl,
    i18n,
    getVideoMetadata,
    getImageDimensions,
    getFileSize,
    copyVideoToCache,
    createVideoTelemetry,
    compressVideo,
    uploadVideo,
    uploadBlob,
    metric,
  } = opts
  let videoBlob: BlobRef | undefined = media.videoBlob
  let captionBlobs = [...media.captionBlobs]
  let releaseCopy: (() => void) | undefined
  /*
   * Telemetry matches the existing composer's funnel. It starts once the
   * source is prepared, since the instance reads source metadata only when
   * it is created. A caption-only retry reuses the uploaded video and its
   * telemetry. The stage decides which failure event an error belongs to;
   * failures before telemetry exists report `prepareFailed` directly.
   */
  let telemetry = videoBlob ? opts.uploadedVideoTelemetry : undefined
  let stage: VideoStage | undefined
  try {
    /* A caption-only retry can safely reuse the completed video result. */
    let compressed: CompressedVideo | undefined
    if (!videoBlob) {
      report({...opts, status: {state: 'uploading', phase: 'validating'}})
      /*
       * The item keeps its original URI and durable local ref; only this
       * attempt reads the copy, and a retry makes its own.
       */
      let source = media
      if (needsReadableCopy({media})) {
        stage = 'copy'
        const copy = await copyVideoToCache({
          uri: media.uri,
          mimeType: media.mimeType,
        })
        releaseCopy = copy.release
        throwIfAborted({signal})
        source = {...media, uri: copy.uri}
      }
      stage = 'metadata'
      const {asset, metadata} = await prepareVideoSource({
        media: source,
        getVideoMetadata,
        getImageDimensions,
        getFileSize,
      })
      throwIfAborted({signal})
      opts.setMediaSourceMetadata?.(opts.postId, opts.mediaId, metadata)
      const attempt = createVideoTelemetry({
        asset,
        signal: abandonmentSignal,
        metric,
      })
      telemetry = attempt
      opts.setVideoTelemetry?.(opts.postId, opts.mediaId, {telemetry: attempt})
      attempt.picked()
      if (opts.restart) attempt.restarted(opts.restart)
      stage = 'validate'
      validateVideoSource({asset})

      report({...opts, status: {state: 'uploading', phase: 'compressing'}})
      stage = 'compress'
      attempt.compressStarted()
      compressed = await compressVideo(asset, {
        signal,
        /* The compressor probes the source again only for this event. */
        onProbe: probed => attempt.probed(probed),
        onProgress: progress => {
          if (!signal.aborted) {
            report({
              ...opts,
              status: {
                state: 'uploading',
                phase: 'compressing',
                progress,
              },
            })
          }
        },
      })
      throwIfAborted({signal})
      if (compressed.passthroughReason) {
        attempt.compressSkipped({
          size: compressed.size,
          mimeType: compressed.mimeType,
          skipReason: compressed.passthroughReason,
        })
      } else {
        attempt.compressCompleted({
          size: compressed.size,
          mimeType: compressed.mimeType,
        })
      }

      /*
       * The existing composer has no client-side size check here; an
       * oversized native output fails at upload, so report it there.
       */
      stage = 'upload'
      attempt.uploadStarted(compressed.size)
      /* The upload-output size limit applies to what compression produced. */
      if (compressed.size > VIDEO_MAX_SIZE) throw new VideoTooLargeError()
      opts.setMediaCompressionResult?.(opts.postId, opts.mediaId, {
        kind: 'video',
        uri: compressed.uri,
        size: compressed.size,
        mimeType: compressed.mimeType,
        width: asset.width,
        height: asset.height,
        aspectRatio: {width: asset.width, height: asset.height},
      })

      report({
        ...opts,
        status: {state: 'uploading', phase: 'uploading', progress: 0},
      })
      const uploadResult = await uploadVideo({
        video: compressed,
        client: pdsClient,
        dispatchUrl: pdsUrl,
        signal,
        i18n,
        setProgress: progress => {
          if (!signal.aborted) {
            report({
              ...opts,
              status: {
                state: 'uploading',
                phase: 'uploading',
                progress,
              },
            })
          }
        },
      })
      throwIfAborted({signal})
      /*
       * Like the existing composer, an upload that returns an already
       * finished job still records the processing phase.
       */
      attempt.uploadCompleted(uploadResult.jobId)
      stage = 'processing'
      attempt.processingStarted(uploadResult.jobId)
      if (uploadResult.state === 'JOB_STATE_FAILED') {
        throw new VideoJobError(
          uploadResult.error ?? 'Video failed to process',
          uploadResult.failureCode,
        )
      }
      if (uploadResult.state === 'JOB_STATE_COMPLETED') {
        videoBlob = uploadResult.blob
        if (!videoBlob)
          throw new VideoJobError('Completed video did not return a blob')
      } else {
        if (!uploadResult.jobId)
          throw new VideoJobError('Video upload did not return a job')
        videoBlob = await pollVideoJob({
          jobId: uploadResult.jobId,
          ...opts,
          signal,
        })
      }
      throwIfAborted({signal})
      attempt.processingCompleted()
      stage = undefined
      opts.setVideoTelemetry?.(opts.postId, opts.mediaId, {
        telemetry: attempt,
        blob: videoBlob,
      })
    }

    if (!videoBlob)
      throw new VideoJobError('Video upload did not return a blob')
    report({
      ...opts,
      status: {
        state: 'uploading',
        phase: 'captions',
        progress: captionBlobs.length === media.captions.length ? 1 : undefined,
      },
    })
    stage = 'captions'
    for (const caption of media.captions) {
      if (
        !caption.lang ||
        captionBlobs.some(item => item.lang === caption.lang)
      ) {
        continue
      }
      throwIfAborted({signal})
      const result = await uploadBlob(
        pdsClient,
        new Blob([caption.content], {type: 'text/vtt'}),
        'text/vtt',
      )
      captionBlobs = [...captionBlobs, {lang: caption.lang, blob: result.blob}]
      opts.setCaptionBlobs?.(opts.postId, opts.mediaId, captionBlobs)
    }
    throwIfAborted({signal})
    report({
      ...opts,
      status: {state: 'uploaded', blob: videoBlob, captionBlobs},
    })
  } catch (error) {
    if (isAborted({error, signal})) return
    reportVideoFailure({
      stage,
      error,
      telemetry,
      media,
      metric,
    })
    const failed = failureStatus({error, i18n, kind: 'video'})
    if (videoBlob) {
      failed.blob = videoBlob
      failed.captionBlobs = captionBlobs
    }
    reportFailure({...opts, status: failed, cause: error})
  } finally {
    /*
     * Runs once the attempt settles, including after cancellation, so the
     * copy outlives compression and upload (a pass-through returns its URI).
     */
    try {
      releaseCopy?.()
    } catch {
      /* A leftover cache file is harmless; it must not fail the upload. */
    }
  }
}

/**
 * Restored Android draft videos are read through a simple-named cache copy,
 * like the existing composer's draft restore; see `copyVideoToCache`. Only
 * restored items carry a local ref, and other sources are read directly.
 */
function needsReadableCopy({media}: {media: PostMediaVideo}) {
  return IS_ANDROID && !!media.localRefPath
}

/**
 * Checks the source before compression. Upload-output limits (format and
 * `VIDEO_MAX_SIZE`) only apply here where compression cannot change the
 * source; otherwise they are enforced on the compressed output.
 *
 * - Native transcodes any non-GIF video to an acceptable format and compresses
 *   large sources, so only the source kind is checked.
 * - Web may pass the source through unchanged (small files, no WebCodecs, or
 *   compression failure), so the upload MIME allowlist still applies. The web
 *   compressor enforces the size limit on its pass-through output itself.
 * - GIFs are never compressed on either platform, so their source size is
 *   the output size.
 */
/** Where a video attempt was when it failed, for its telemetry event. */
type VideoStage =
  | 'copy'
  | 'metadata'
  | 'validate'
  | 'compress'
  | 'upload'
  | 'processing'
  | 'captions'

/** Report a failed attempt to the telemetry event for the stage it failed in. */
function reportVideoFailure({
  stage,
  error,
  telemetry,
  media,
  metric,
}: {
  stage: VideoStage | undefined
  error: unknown
  telemetry: VideoTelemetry | undefined
  media: PostMediaVideo
  metric: AnalyticsContextType['metric']
}) {
  switch (stage) {
    case 'copy':
    case 'metadata':
      metric('video:upload:prepareFailed', {
        step: stage,
        restored: !!media.localRefPath,
        sourceMimeType: media.mimeType,
        errorClass: errorClass(error),
      })
      return
    case 'validate': {
      const code = videoValidationFailure({error})
      if (code) telemetry?.validationFailed(code)
      return
    }
    case 'compress':
      return telemetry?.compressFailed(error)
    case 'upload':
      return telemetry?.uploadFailed(error)
    case 'processing':
      return telemetry?.processingFailed(error)
    case 'captions':
      return telemetry?.captionsFailed(error)
  }
}

function videoValidationFailure({
  error,
}: {
  error: unknown
}): VideoValidationFailure | undefined {
  if (error instanceof VideoTooLargeError) return 'video-too-large'
  if (!(error instanceof ValidationError)) return undefined
  switch (error.code) {
    case 'unsupported-video-format':
    case 'invalid-video-dimensions':
    case 'video-too-long':
      return error.code
  }
  return undefined
}

function validateVideoSource({asset}: {asset: ImagePickerAsset}) {
  const {mimeType} = asset
  const isGif = mimeType === 'image/gif'
  const isAcceptableFormat =
    !!mimeType && SUPPORTED_MIME_TYPES.includes(mimeType as never)
  const isTranscodable = !IS_WEB && !!mimeType?.startsWith('video/')
  if (!isAcceptableFormat && !isTranscodable) {
    throw new ValidationError('unsupported-video-format')
  }
  if (!validDimensions(asset)) {
    throw new ValidationError('invalid-video-dimensions')
  }
  if (asset.duration != null && asset.duration > VIDEO_MAX_DURATION_MS) {
    throw new ValidationError('video-too-long')
  }
  const sourceSize = asset.fileSize ?? asset.file?.size
  if (isGif && sourceSize != null && sourceSize > VIDEO_MAX_SIZE) {
    throw new VideoTooLargeError()
  }
}

async function pollVideoJob({
  jobId,
  signal,
  createVideoServiceClient,
  sleep,
  ...opts
}: VideoOptions & {
  jobId: string
  signal: AbortSignal
}): Promise<BlobRef> {
  const client = createVideoServiceClient()
  let failures = 0
  while (true) {
    throwIfAborted({signal})
    try {
      const response = await client.call(app.bsky.video.getJobStatus, {jobId})
      const status = response.jobStatus
      if (status.state === 'JOB_STATE_COMPLETED') {
        if (!status.blob)
          throw new VideoJobError('Completed video did not return a blob')
        return status.blob
      }
      if (status.state === 'JOB_STATE_FAILED') {
        throw new VideoJobError(
          status.error ?? 'Video failed to process',
          status.failureCode,
        )
      }
      failures = 0
      report({
        ...opts,
        status: {
          state: 'uploading',
          phase: 'processing',
          progress: status.progress == null ? undefined : status.progress / 100,
        },
      })
    } catch (error) {
      if (isAborted({error, signal})) throw error
      if (error instanceof VideoJobError) throw error
      failures += 1
      if (failures >= 5) throw error
    }
    await sleep({ms: VIDEO_JOB_POLL_INTERVAL_MS, signal})
  }
}

function validDimensions({width, height}: {width: number; height: number}) {
  return (
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
  )
}

function report({
  postId,
  mediaId,
  setUploadStatus,
  status,
}: Pick<BaseOptions, 'postId' | 'mediaId' | 'setUploadStatus'> & {
  status: UploadStatus
}) {
  setUploadStatus(postId, mediaId, status)
}

/** Diagnostics travel beside worker status, never inside published snapshots. */
function reportFailure({
  postId,
  mediaId,
  setUploadStatus,
  status,
  cause,
}: Pick<BaseOptions, 'postId' | 'mediaId' | 'setUploadStatus'> & {
  status: Extract<UploadStatus, {state: 'failed'}>
  cause: unknown
}) {
  const kind =
    cause instanceof ValidationError || cause instanceof VideoTooLargeError
      ? 'validation'
      : cause instanceof UploadLimitError ||
          cause instanceof VideoJobError ||
          isNetworkError(cause) ||
          shouldRetryError(cause)
        ? 'operational'
        : 'unexpected'
  setUploadStatus(postId, mediaId, status, {kind, cause})
}

function failureStatus({
  error,
  i18n,
  kind,
}: {
  error: unknown
  i18n: I18n
  kind: 'image' | 'video'
}): Extract<UploadStatus, {state: 'failed'}> {
  const validation = error instanceof ValidationError
  const retryable =
    !validation &&
    !(error instanceof UploadLimitError) &&
    !(error instanceof VideoTooLargeError)
  let message: string
  if (validation) {
    message = validationMessage({code: error.code, i18n})
  } else if (error instanceof VideoTooLargeError) {
    message = i18n._(
      msg`The selected video is too large. Please try again with a smaller file.`,
    )
  } else if (error instanceof UploadLimitError) {
    message = error.message
  } else if (isNetworkError(error) || shouldRetryError(error)) {
    message = i18n._(
      msg`An upload failed. Please check your internet connection and try again.`,
    )
  } else if (kind === 'image') {
    message = i18n._(msg`The image could not be processed or uploaded.`)
  } else if (
    error instanceof VideoJobError &&
    error.failureCode === 'validation_failure'
  ) {
    message = i18n._(msg`The selected video could not be processed.`)
  } else {
    message = i18n._(msg`The video could not be processed or uploaded.`)
  }
  return {
    state: 'failed' as const,
    error: message,
    code: validation
      ? error.code
      : error instanceof VideoJobError
        ? error.failureCode
        : undefined,
    retryable:
      error instanceof VideoJobError &&
      error.failureCode === 'validation_failure'
        ? false
        : retryable,
  }
}

function validationMessage({code, i18n}: {code: string; i18n: I18n}) {
  switch (code) {
    case 'video-too-long':
      return i18n._(msg`The selected video is too long.`)
    case 'unsupported-video-format':
      return i18n._(msg`The selected video uses an unsupported format.`)
    case 'invalid-video-dimensions':
      return i18n._(msg`The selected video has invalid dimensions.`)
    case 'invalid-image-dimensions':
      return i18n._(msg`The selected image has invalid dimensions.`)
    default:
      return i18n._(msg`The selected media is not valid.`)
  }
}

function isAborted({error, signal}: {error: unknown; signal: AbortSignal}) {
  return (
    signal.aborted ||
    error instanceof AbortError ||
    (error instanceof Error && error.name === 'AbortError')
  )
}

function throwIfAborted({signal}: {signal: AbortSignal}) {
  if (signal.aborted) throw new AbortError()
}

class ValidationError extends Error {
  constructor(public code: string) {
    super(code)
    this.name = 'ValidationError'
  }
}

class VideoJobError extends Error {
  constructor(
    public message: string,
    public failureCode?: string,
  ) {
    super(message)
    this.name = 'VideoJobError'
  }
}
