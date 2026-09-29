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
import {type CompressedVideo} from '#/lib/media/video/types'
import {isNetworkError, shouldRetryError} from '#/lib/strings/errors'
import {type ComposerImage} from '#/state/gallery'
import {IS_WEB} from '#/env'
import {app} from '#/lexicons'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type UploadedCaption,
  type UploadStatus,
} from './types'

/** Runtime handle owned by the store, never published in ThreadState. */
export type UploadTask = {cancel(): void}

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

/** Implementations the image worker calls. */
export type ImageUploadDependencies = {
  compressImage: (typeof import('#/lib/media/image/compress'))['compressImage']
  uploadBlob: UploadBlob
}

/** Implementations the video worker calls, including caption blob uploads. */
export type VideoUploadDependencies = {
  getVideoMetadata: (typeof import('#/view/com/composer/videos/metadata'))['getVideoMetadata']
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
  setCaptionBlobs?: (
    postId: string,
    mediaId: string,
    captions: UploadedCaption[],
  ) => void
}

type ImageOptions = BaseOptions &
  ImageUploadDependencies & {media: PostMediaImage}
type VideoOptions = BaseOptions &
  VideoUploadDependencies & {media: PostMediaVideo}

/** Start the image compression and PDS upload pipeline. */
export function startImageUpload(opts: ImageOptions): UploadTask {
  const controller = new AbortController()
  void runImageUpload({...opts, signal: controller.signal})
  return {cancel: () => controller.abort()}
}

/** Start compression, multipart upload, processing polling, and caption uploads. */
export function startVideoUpload(opts: VideoOptions): UploadTask {
  const controller = new AbortController()
  void runVideoUpload({...opts, signal: controller.signal})
  return {cancel: () => controller.abort()}
}

async function runImageUpload({
  signal,
  ...opts
}: ImageOptions & {signal: AbortSignal}) {
  const {media, pdsClient, i18n, compressImage, uploadBlob} = opts
  try {
    report({...opts, status: {state: 'uploading', phase: 'compressing'}})

    /*
     * compressImage has no cancellation hook. Cancellation is therefore
     * logical here: the result is ignored and no upload starts after abort.
     */
    const image: ComposerImage = {
      alt: media.altText,
      source: {
        id: media.id,
        path: media.uri,
        width: media.width,
        height: media.height,
        mime: media.mimeType ?? 'image/jpeg',
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
  ...opts
}: VideoOptions & {signal: AbortSignal}) {
  const {
    media,
    pdsClient,
    pdsUrl,
    i18n,
    getVideoMetadata,
    compressVideo,
    uploadVideo,
    uploadBlob,
  } = opts
  let videoBlob: BlobRef | undefined = media.videoBlob
  let captionBlobs = [...media.captionBlobs]
  try {
    /* A caption-only retry can safely reuse the completed video result. */
    let compressed: CompressedVideo | undefined
    if (!videoBlob) {
      report({...opts, status: {state: 'uploading', phase: 'validating'}})
      const asset = await getAsset({media, getVideoMetadata})
      validateVideo({asset})
      throwIfAborted({signal})

      report({...opts, status: {state: 'uploading', phase: 'compressing'}})
      compressed = await compressVideo(asset, {
        signal,
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
    const failed = failureStatus({error, i18n, kind: 'video'})
    if (videoBlob) {
      failed.blob = videoBlob
      failed.captionBlobs = captionBlobs
    }
    reportFailure({...opts, status: failed, cause: error})
  }
}

async function getAsset({
  media,
  getVideoMetadata: metadata,
}: {
  media: PostMediaVideo
  getVideoMetadata: VideoUploadDependencies['getVideoMetadata']
}): Promise<ImagePickerAsset> {
  if (media.file) return metadata(media.file as File, media.mimeType)
  if (IS_WEB && media.uri.startsWith('blob:')) {
    const blob = await fetch(media.uri).then(response => response.blob())
    return metadata(
      new File([blob], 'video', {type: media.mimeType}),
      media.mimeType,
    )
  }
  return metadata(media.uri, media.mimeType)
}

function validateVideo({asset}: {asset: ImagePickerAsset}) {
  if (
    !asset.mimeType ||
    !SUPPORTED_MIME_TYPES.includes(asset.mimeType as never)
  ) {
    throw new ValidationError('unsupported-video-format')
  }
  if (!asset.width || !asset.height || asset.width <= 0 || asset.height <= 0) {
    throw new ValidationError('invalid-video-dimensions')
  }
  if (asset.duration != null && asset.duration > VIDEO_MAX_DURATION_MS) {
    throw new ValidationError('video-too-long')
  }
  if (asset.fileSize != null && asset.fileSize > VIDEO_MAX_SIZE) {
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
