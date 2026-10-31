import {type ImagePickerAsset} from 'expo-image-picker'
import {type BlobRef} from '@atproto/lex'

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
import {
  type ComposerV2ErrorKind,
  isComposerV2Cancellation,
} from '#/components/ComposerV2/errors'
import {type AnalyticsContextType} from '#/analytics'
import {IS_ANDROID, IS_WEB} from '#/env'
import {app} from '#/lexicons'
import {
  type GetVideoMetadata,
  prepareImageSource,
  prepareVideoSource,
} from './prepareMediaSource'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type PreparedImage,
  type PreparedVideo,
  type ResolvedSourceMetadata,
  type UploadDiagnostic,
  type UploadedCaption,
  type UploadFailureCode,
  type UploadRuntime,
  type UploadStatus,
} from './types'
import {type createConcurrencyLimit} from './utils/createConcurrencyLimit'
import {validDimensions} from './utils/validDimensions'
import {ValidationError} from './validationError'

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

/**
 * One upload attempt for one item. The store binds and guards these; calls
 * from a stale attempt are ignored.
 */
export type UploadAttempt = {
  /** Reports progress or completion; failures go through `reportFailure`. */
  reportStatus(args: {status: Exclude<UploadStatus, {state: 'failed'}>}): void
  /** Diagnostics travel beside worker status, never inside published snapshots. */
  reportFailure(args: {
    status: Extract<UploadStatus, {state: 'failed'}>
    diagnostic: UploadDiagnostic
  }): void
  /**
   * Called with the prepared source metadata. The store keeps what the item
   * did not know, so a retry of the same item does not read the source again.
   */
  setSourceMetadata(args: {metadata: ResolvedSourceMetadata}): void
}

export type ImageUploadAttempt = UploadAttempt & {
  /**
   * Called after local compression, before the upload starts. Records the
   * compressed output alongside the original source; it does not mark the
   * upload complete.
   */
  setCompressionResult(args: {prepared: PreparedImage}): void
}

export type VideoUploadAttempt = UploadAttempt & {
  /**
   * Called after local compression, before the upload starts. Records the
   * compressed output alongside the original source; it does not mark the
   * upload complete. A video's dimensions are the source's, not the output's
   * (see `PreparedVideo`).
   */
  setCompressionResult(args: {prepared: PreparedVideo}): void
  /** Records the caption blobs uploaded so far. */
  setCaptionBlobs(args: {captions: UploadedCaption[]}): void
  /**
   * Leases the compression result an earlier attempt retained, if any. The
   * attempt must release the lease.
   */
  acquireCompressedVideo(): CompressedVideoLease | undefined
  /**
   * Retains a completed, validated compression result for later attempts
   * and returns this attempt's lease on it. When `release` is given (the
   * output aliases a readable copy, or is a native encoded file), on success
   * the store takes over calling it, once nothing reads the output. Returns
   * undefined, taking nothing over, when the attempt is stale.
   */
  retainCompressedVideo(args: {
    video: CompressedVideo
    release?: () => void
  }): CompressedVideoLease | undefined
  /**
   * Called when the attempt creates its telemetry, and again with the blob
   * once the video is processed. The store links restarts and reports
   * publication through the same instance, and adopts the blob onto the
   * item so a caption restart reuses the processed video.
   */
  setVideoTelemetry(args: {telemetry: VideoTelemetry; blob?: BlobRef}): void
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
  /**
   * Frees the selected compression output. The worker owns it from the moment
   * `compressImage` resolves and calls this once, after its last reader (the
   * upload) settles. Never called for the source. Failures are ignored.
   */
  releaseCompressedImage: (args: {uri: string}) => void | Promise<void>
  /**
   * Gates the memory-heavy phase: the dimension read and compression. A task
   * queued when its signal aborts never runs; a running one keeps its slot
   * until it settles, since neither step can be aborted. Upload runs outside
   * it. Production shares one instance across stores; see
   * `uploadDependencies.ts`.
   */
  limitImageCompression: ReturnType<typeof createConcurrencyLimit>
}

/** Implementations the video worker calls, including caption blob uploads. */
export type VideoUploadDependencies = {
  /**
   * Called only for non-GIF sources still missing metadata. Returns scalars
   * only; any URL the probe created is the implementation's to release.
   */
  getVideoMetadata: GetVideoMetadata
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
  /**
   * The shared helper without its `i18n` argument; production binds the
   * global instance in `uploadDependencies.ts`, so state stays free of copy.
   */
  uploadVideo: (
    args: Omit<
      Parameters<(typeof import('#/lib/media/video/upload'))['uploadVideo']>[0],
      'i18n'
    >,
  ) => ReturnType<(typeof import('#/lib/media/video/upload'))['uploadVideo']>
  /**
   * Deletes a native encoded compression output. The worker calls it only for
   * output it produced (no pass-through reason, no web `bytes`), never for
   * the source, a readable copy, or a pass-through alias. Failures are ignored.
   */
  releaseCompressedVideo: (args: {uri: string}) => void | Promise<void>
  /** Caption blobs go to the account PDS. */
  uploadBlob: UploadBlob
  createVideoServiceClient: (typeof import('#/lib/media/video/util'))['createTokenlessVideoServiceClient']
  /** Waits between processing polls; rejects with AbortError on cancellation. */
  sleep: (args: {ms: number; signal: AbortSignal}) => Promise<void>
}

/**
 * A reader's hold on a compression result the store retained for retries.
 * The store defers cleanup of the output until every lease is released, even
 * after the entry is retired.
 */
export type CompressedVideoLease = {
  video: CompressedVideo
  /** Drops the entry because its output is unusable; a no-op once retired. */
  invalidate(): void
  /** Ends this reader's use. Idempotent. */
  release(): void
}

/** Delay between video processing status polls. */
const VIDEO_JOB_POLL_INTERVAL_MS = 1500

type ImageOptions = UploadRuntime &
  ImageUploadDependencies & {
    attempt: ImageUploadAttempt
    media: PostMediaImage
  }
type VideoOptions = UploadRuntime &
  VideoUploadDependencies & {
    attempt: VideoUploadAttempt
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
    attempt,
    media,
    pdsClient,
    getImageDimensions,
    compressImage,
    uploadBlob,
    releaseCompressedImage,
    limitImageCompression,
  } = opts
  /*
   * Owned from the moment compressImage resolves, wherever the attempt ends.
   * The limiter settles only after a running task does, so this finally runs
   * after a late compression result and after any started upload.
   */
  let output: {path: string} | undefined
  try {
    attempt.reportStatus({status: {state: 'uploading', phase: 'compressing'}})

    /*
     * Neither the dimension read nor compressImage has a cancellation hook.
     * Cancellation is therefore logical here: late results are ignored and no
     * later step starts after abort. The limiter keeps a canceled running
     * attempt's slot until its work settles, so it still counts against the
     * cap. The upload below runs outside the slot.
     */
    const compressed = await limitImageCompression({
      signal,
      task: async () => {
        const {source, metadata} = await prepareImageSource({
          media,
          getImageDimensions,
        })
        throwIfAborted({signal})
        attempt.setSourceMetadata({metadata})
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
        const result = await compressImage({image, ...IMAGE_SIZE_CONFIG_POSTS})
        output = result
        throwIfAborted({signal})
        const prepared = {
          width: result.width,
          height: result.height,
          mimeType: result.mime,
          aspectRatio: {width: result.width, height: result.height},
          size: result.size,
        }
        attempt.setCompressionResult({prepared})
        return result
      },
    })
    throwIfAborted({signal})
    attempt.reportStatus({status: {state: 'uploading', phase: 'uploading'}})
    const result = await uploadBlob(pdsClient, compressed.path, compressed.mime)
    throwIfAborted({signal})
    attempt.reportStatus({status: {state: 'uploaded', blob: result.blob}})
  } catch (error) {
    if (signal.aborted || isComposerV2Cancellation({cause: error})) return
    attempt.reportFailure(failureReport({error, mediaKind: 'image'}))
  } finally {
    if (output) {
      const {path} = output
      releaseQuietly(() => releaseCompressedImage({uri: path}))
    }
  }
}

/** What the failure handler needs to know about an attempt in flight. */
type VideoFailureContext = {
  /** Which phase an error belongs to; undefined once processing finished. */
  stage?: VideoStage
  /**
   * Starts once the source is prepared, since the instance reads source
   * metadata only when it is created. A caption-only retry starts with the
   * telemetry of the upload it follows. Failures before it exists report
   * `prepareFailed` directly.
   */
  telemetry?: VideoTelemetry
}

/**
 * What an attempt must clean up. Entries are cleared as the store takes them
 * over or they are released; see `releaseVideoResources`.
 */
type VideoResources = {
  /** The lease on the retained compression result; must not outlive its use. */
  lease?: CompressedVideoLease
  /** Deletes the Android readable copy this attempt made. */
  releaseCopy?: () => void
  /** Deletes a native encoded output this attempt produced. */
  releaseOutput?: () => void
}

/** The attempt's reusable inputs, shared by the compression sub-steps. */
type ObtainVideoArgs = Pick<
  VideoOptions,
  'attempt' | 'media' | 'metric' | 'restart'
> &
  Pick<
    VideoUploadDependencies,
    | 'getVideoMetadata'
    | 'getImageDimensions'
    | 'getFileSize'
    | 'copyVideoToCache'
    | 'createVideoTelemetry'
    | 'compressVideo'
    | 'releaseCompressedVideo'
  > & {
    signal: AbortSignal
    abandonmentSignal: AbortSignal
    failure: VideoFailureContext
  }

async function runVideoUpload({
  signal,
  abandonmentSignal,
  ...opts
}: VideoOptions & {signal: AbortSignal; abandonmentSignal: AbortSignal}) {
  const {attempt, media, pdsClient, pdsUrl, uploadBlob, metric} = opts
  let videoBlob: BlobRef | undefined = media.videoBlob
  let captionBlobs = [...media.captionBlobs]
  /* A caption-only retry reuses the uploaded video and its telemetry. */
  const failure: VideoFailureContext = {
    telemetry: videoBlob ? opts.uploadedVideoTelemetry : undefined,
  }
  let obtained: Awaited<ReturnType<typeof obtainCompressedVideo>> | undefined
  try {
    /* A caption-only retry can safely reuse the completed video result. */
    if (!videoBlob) {
      obtained = await obtainCompressedVideo({
        attempt,
        media,
        metric,
        restart: opts.restart,
        getVideoMetadata: opts.getVideoMetadata,
        getImageDimensions: opts.getImageDimensions,
        getFileSize: opts.getFileSize,
        copyVideoToCache: opts.copyVideoToCache,
        createVideoTelemetry: opts.createVideoTelemetry,
        compressVideo: opts.compressVideo,
        releaseCompressedVideo: opts.releaseCompressedVideo,
        signal,
        abandonmentSignal,
        failure,
      })
      videoBlob = await uploadAndProcessVideo({
        video: obtained.video,
        telemetry: obtained.telemetry,
        attempt,
        signal,
        failure,
        pdsClient,
        pdsUrl,
        uploadVideo: opts.uploadVideo,
        createVideoServiceClient: opts.createVideoServiceClient,
        sleep: opts.sleep,
      })
      /*
       * The store adopts the blob here, before captions begin, so a caption
       * edit during their upload restarts from this video instead of
       * compressing and uploading it again. Its subscribers run
       * synchronously and may restart or remove the item, retiring this
       * attempt, which must then start no more work. Nothing reads the
       * compressed output past this point.
       */
      attempt.setVideoTelemetry({
        telemetry: obtained.telemetry,
        blob: videoBlob,
      })
      obtained.release()
      throwIfAborted({signal})
    }

    attempt.reportStatus({
      status: {
        state: 'uploading',
        phase: 'captions',
        progress: captionBlobs.length === media.captions.length ? 1 : undefined,
      },
    })
    failure.stage = 'captions'
    captionBlobs = await uploadCaptions({
      captions: media.captions,
      uploaded: captionBlobs,
      pdsClient,
      uploadBlob,
      signal,
      onUploaded: captions => {
        captionBlobs = captions
        attempt.setCaptionBlobs({captions})
      },
    })
    throwIfAborted({signal})
    attempt.reportStatus({
      status: {state: 'uploaded', blob: videoBlob, captionBlobs},
    })
  } catch (error) {
    if (signal.aborted || isComposerV2Cancellation({cause: error})) return
    reportVideoFailure({
      stage: failure.stage,
      error,
      telemetry: failure.telemetry,
      media,
      metric,
    })
    const report = failureReport({error, mediaKind: 'video'})
    if (videoBlob) {
      report.status.blob = videoBlob
      report.status.captionBlobs = captionBlobs
    }
    attempt.reportFailure(report)
  } finally {
    /*
     * Runs once the attempt settles, including after cancellation, so the
     * copy outlives compression and upload (a pass-through returns its URI).
     */
    obtained?.release()
  }
}

/**
 * Reuses a retained compression or compresses fresh. `release` is idempotent
 * and frees the lease, the readable copy, and any output this attempt still
 * owns. When this throws, everything it acquired is already released.
 */
async function obtainCompressedVideo({
  failure,
  ...args
}: ObtainVideoArgs): Promise<{
  video: CompressedVideo
  telemetry: VideoTelemetry
  release: () => void
}> {
  const {attempt, media, signal, getFileSize} = args
  const resources: VideoResources = {}
  const release = () => releaseVideoResources({resources})
  try {
    attempt.reportStatus({status: {state: 'uploading', phase: 'validating'}})
    /*
     * Reuse the compression result an earlier attempt retained. Native
     * output is a file that may have been removed since, so confirm it
     * still reads; if not, drop the entry and compress once, below.
     */
    resources.lease = attempt.acquireCompressedVideo()
    if (
      resources.lease &&
      !(await isOutputReadable({video: resources.lease.video, getFileSize}))
    ) {
      resources.lease.invalidate()
      releaseVideoResources({resources})
    }
    throwIfAborted({signal})
    if (!resources.lease) {
      const fresh = await compressVideoFresh({...args, failure, resources})
      return {...fresh, release}
    }
    /*
     * No source preparation: the item already holds the metadata the first
     * attempt resolved, and no compressor ran, so this attempt reports no
     * compression or probe events.
     */
    const {video} = resources.lease
    const telemetry = startVideoTelemetry({
      ...args,
      asset: videoAssetFromMedia({media}),
      failure,
    })
    failure.stage = 'upload'
    telemetry.uploadStarted(video.size)
    validateCompressedVideo({video})
    return {video, telemetry, release}
  } catch (error) {
    release()
    throw error
  }
}

/**
 * Prepares the source, compresses it, and retains the result for later
 * attempts. Whatever it acquires is recorded in `resources`.
 */
async function compressVideoFresh({
  failure,
  resources,
  ...args
}: ObtainVideoArgs & {resources: VideoResources}): Promise<{
  video: CompressedVideo
  telemetry: VideoTelemetry
}> {
  const {
    attempt,
    media,
    signal,
    getVideoMetadata,
    getImageDimensions,
    getFileSize,
    copyVideoToCache,
    compressVideo,
    releaseCompressedVideo,
  } = args
  /*
   * The item keeps its original URI and durable local ref; only this
   * attempt reads the copy, and a retry makes its own.
   */
  let source = media
  if (needsReadableCopy({media})) {
    failure.stage = 'copy'
    const copy = await copyVideoToCache({
      uri: media.uri,
      mimeType: media.mimeType,
    })
    resources.releaseCopy = copy.release
    throwIfAborted({signal})
    source = {...media, uri: copy.uri}
  }
  failure.stage = 'metadata'
  const {asset, metadata} = await prepareVideoSource({
    media: source,
    getVideoMetadata,
    getImageDimensions,
    getFileSize,
  })
  throwIfAborted({signal})
  attempt.setSourceMetadata({metadata})
  /*
   * Telemetry outlives this attempt, so it gets scalars only; the asset
   * carries the source File, which only the compressor needs.
   */
  const telemetry = startVideoTelemetry({
    ...args,
    asset: scalarVideoAsset({asset}),
    failure,
  })
  failure.stage = 'validate'
  validateVideoSource({asset})

  attempt.reportStatus({status: {state: 'uploading', phase: 'compressing'}})
  failure.stage = 'compress'
  telemetry.compressStarted()
  const video = await compressVideo(asset, {
    signal,
    /* The compressor probes the source again only for this event. */
    onProbe: probed => telemetry.probed(probed),
    onProgress: progress => {
      if (!signal.aborted) {
        attempt.reportStatus({
          status: {state: 'uploading', phase: 'compressing', progress},
        })
      }
    },
  })
  const {uri: outputUri} = video
  if (isNativeEncodedOutput({video})) {
    resources.releaseOutput = () =>
      releaseQuietly(() => releaseCompressedVideo({uri: outputUri}))
  }
  throwIfAborted({signal})
  if (video.passthroughReason) {
    telemetry.compressSkipped({
      size: video.size,
      mimeType: video.mimeType,
      skipReason: video.passthroughReason,
    })
  } else {
    telemetry.compressCompleted({size: video.size, mimeType: video.mimeType})
  }

  /*
   * The existing composer has no client-side size check here; an oversized
   * native output fails at upload, so report it there.
   */
  failure.stage = 'upload'
  telemetry.uploadStarted(video.size)
  validateCompressedVideo({video})
  attempt.setCompressionResult({
    prepared: {
      size: video.size,
      mimeType: video.mimeType,
      /* Source display dimensions; the CompressedVideo contract has none. */
      width: asset.width,
      height: asset.height,
      aspectRatio: {width: asset.width, height: asset.height},
    },
  })
  retainVideoResult({
    attempt,
    video,
    aliasesSource: video.uri === source.uri,
    resources,
  })
  return {video, telemetry}
}

/**
 * Creates the attempt's telemetry and records it with the store, then reports
 * the pick and any restart.
 */
function startVideoTelemetry({
  asset,
  attempt,
  createVideoTelemetry,
  abandonmentSignal,
  metric,
  restart,
  failure,
}: Pick<
  ObtainVideoArgs,
  'attempt' | 'createVideoTelemetry' | 'metric' | 'restart'
> & {
  asset: ImagePickerAsset
  abandonmentSignal: AbortSignal
  failure: VideoFailureContext
}) {
  const telemetry = createVideoTelemetry({
    asset,
    signal: abandonmentSignal,
    metric,
  })
  failure.telemetry = telemetry
  attempt.setVideoTelemetry({telemetry})
  telemetry.picked()
  if (restart) telemetry.restarted(restart)
  return telemetry
}

/**
 * Retains a finished, validated result for later attempts, and hands the
 * store whatever it must clean up with the entry. A pass-through that returns
 * the readable copy's URI needs the copy for as long as the entry lives, so
 * the store takes over releasing it. Likewise the store deletes a native
 * encoded output with the entry, once its last reader is done. An encoded
 * output does not alias the copy, which this attempt still releases. Whatever
 * the store does not take over stays in `resources`.
 */
function retainVideoResult({
  attempt,
  video,
  aliasesSource,
  resources,
}: {
  attempt: VideoUploadAttempt
  video: CompressedVideo
  /** Whether the output is the source URI, which may be the readable copy. */
  aliasesSource: boolean
  resources: VideoResources
}) {
  const aliasesCopy = !!resources.releaseCopy && aliasesSource
  const lease = attempt.retainCompressedVideo({
    video,
    release: aliasesCopy ? resources.releaseCopy : resources.releaseOutput,
  })
  if (!lease) return
  resources.lease = lease
  if (aliasesCopy) resources.releaseCopy = undefined
  else resources.releaseOutput = undefined
}

/**
 * Releases everything in `resources`, once. Cleanup must not fail the upload,
 * and a leftover cache file is harmless.
 */
function releaseVideoResources({resources}: {resources: VideoResources}) {
  const {lease, releaseCopy, releaseOutput} = resources
  resources.lease = undefined
  resources.releaseCopy = undefined
  resources.releaseOutput = undefined
  try {
    lease?.release()
  } catch {
    /* Cleanup must not fail the upload. */
  }
  try {
    releaseCopy?.()
  } catch {
    /* A leftover cache file is harmless. */
  }
  /* Already quiet; see `releaseQuietly`. */
  releaseOutput?.()
}

/** Uploads compressed bytes and polls the processing job. */
async function uploadAndProcessVideo({
  video,
  telemetry,
  attempt,
  signal,
  failure,
  pdsClient,
  pdsUrl,
  uploadVideo,
  createVideoServiceClient,
  sleep,
}: Pick<VideoOptions, 'attempt' | 'pdsClient' | 'pdsUrl'> &
  Pick<
    VideoUploadDependencies,
    'uploadVideo' | 'createVideoServiceClient' | 'sleep'
  > & {
    video: CompressedVideo
    telemetry: VideoTelemetry
    signal: AbortSignal
    failure: VideoFailureContext
  }): Promise<BlobRef> {
  attempt.reportStatus({
    status: {state: 'uploading', phase: 'uploading', progress: 0},
  })
  const uploadResult = await uploadVideo({
    video,
    client: pdsClient,
    dispatchUrl: pdsUrl,
    signal,
    setProgress: progress => {
      if (!signal.aborted) {
        attempt.reportStatus({
          status: {state: 'uploading', phase: 'uploading', progress},
        })
      }
    },
  })
  throwIfAborted({signal})
  /*
   * Like the existing composer, an upload that returns an already finished
   * job still records the processing phase.
   */
  telemetry.uploadCompleted(uploadResult.jobId)
  failure.stage = 'processing'
  telemetry.processingStarted(uploadResult.jobId)
  if (uploadResult.state === 'JOB_STATE_FAILED') {
    throw new VideoJobError(
      uploadResult.error ?? 'Video failed to process',
      uploadResult.failureCode,
    )
  }
  let blob: BlobRef | undefined
  if (uploadResult.state === 'JOB_STATE_COMPLETED') {
    blob = uploadResult.blob
    if (!blob) throw new VideoJobError('Completed video did not return a blob')
  } else {
    if (!uploadResult.jobId)
      throw new VideoJobError('Video upload did not return a job')
    blob = await pollVideoJob({
      jobId: uploadResult.jobId,
      signal,
      createVideoServiceClient,
      sleep,
      attempt,
    })
  }
  throwIfAborted({signal})
  telemetry.processingCompleted()
  failure.stage = undefined
  return blob
}

/**
 * Uploads caption files, skipping languages already in `uploaded`. Reports
 * the full list through `onUploaded` after each upload so a failure keeps the
 * blobs uploaded so far.
 */
async function uploadCaptions({
  captions,
  uploaded,
  pdsClient,
  uploadBlob,
  signal,
  onUploaded,
}: Pick<VideoOptions, 'pdsClient'> &
  Pick<VideoUploadDependencies, 'uploadBlob'> & {
    captions: PostMediaVideo['captions']
    uploaded: UploadedCaption[]
    signal: AbortSignal
    onUploaded: (captions: UploadedCaption[]) => void
  }): Promise<UploadedCaption[]> {
  let result = uploaded
  for (const caption of captions) {
    if (!caption.lang || result.some(item => item.lang === caption.lang)) {
      continue
    }
    throwIfAborted({signal})
    const {blob} = await uploadBlob(
      pdsClient,
      new Blob([caption.content], {type: 'text/vtt'}),
      'text/vtt',
    )
    result = [...result, {lang: caption.lang, blob}]
    onUploaded(result)
  }
  return result
}

/**
 * Runs a cleanup dependency without letting it throw or reject into the
 * operation whose outcome it must not change.
 */
function releaseQuietly(release: () => void | Promise<void>) {
  try {
    void Promise.resolve(release()).catch(() => {})
  } catch {
    /* A leftover file or URL is harmless; it must not fail the upload. */
  }
}

/**
 * A native compressor output that is a new file this worker owns: re-encoded
 * (no pass-through reason) and file-backed (no web `bytes`). Pass-through and
 * GIF results alias the source or its readable copy, and web output keeps its
 * `uri` as the original source.
 */
function isNativeEncodedOutput({video}: {video: CompressedVideo}) {
  return !video.passthroughReason && !video.bytes
}

/** Source metadata without the `File`, for telemetry that outlives the attempt. */
function scalarVideoAsset({
  asset,
}: {
  asset: ImagePickerAsset
}): ImagePickerAsset {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
    duration: asset.duration,
    fileSize: asset.fileSize,
  }
}

/**
 * Whether a retained output can still be read. Web output lives in memory.
 * Native output is a file, perhaps a compressor temp file, that the system may
 * have removed; a size that no longer matches means it is truncated.
 */
async function isOutputReadable({
  video,
  getFileSize,
}: {
  video: CompressedVideo
  getFileSize: VideoUploadDependencies['getFileSize']
}) {
  if (IS_WEB) return true
  try {
    return (await getFileSize(video.uri)) === video.size
  } catch {
    return false
  }
}

/**
 * The upload-output size limit applies to what compression produced, on first
 * and reused attempts alike.
 */
function validateCompressedVideo({video}: {video: CompressedVideo}) {
  if (video.size > VIDEO_MAX_SIZE) throw new VideoTooLargeError()
}

/**
 * Builds the telemetry asset for a reused attempt from the metadata the item
 * resolved earlier.
 */
function videoAssetFromMedia({
  media,
}: {
  media: PostMediaVideo
}): ImagePickerAsset {
  return {
    uri: media.uri,
    mimeType: media.mimeType,
    width: media.width ?? 0,
    height: media.height ?? 0,
    duration: media.duration,
    fileSize: media.fileSize ?? media.file?.size,
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
  attempt,
}: Pick<VideoUploadDependencies, 'createVideoServiceClient' | 'sleep'> & {
  jobId: string
  signal: AbortSignal
  attempt: VideoUploadAttempt
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
      attempt.reportStatus({
        status: {
          state: 'uploading',
          phase: 'processing',
          progress: status.progress == null ? undefined : status.progress / 100,
        },
      })
    } catch (error) {
      if (signal.aborted || isComposerV2Cancellation({cause: error}))
        throw error
      if (error instanceof VideoJobError) throw error
      failures += 1
      if (failures >= 5) throw error
    }
    await sleep({ms: VIDEO_JOB_POLL_INTERVAL_MS, signal})
  }
}

/** The one classification of an upload failure: state, diagnostic, and copy all derive from it. */
export type UploadFailureClassification = {
  code: UploadFailureCode
  retryable: boolean
  kind: ComposerV2ErrorKind
  /** Server-supplied text the UI may show instead of its own copy. */
  detail?: string
}

/**
 * Classifies a worker error once. Order matters: input validation, then the
 * shared limit errors, then a rejected video job, then transport failures,
 * then what is specific to the kind of media.
 */
export function classifyUploadError({
  error,
  mediaKind,
}: {
  error: unknown
  mediaKind: 'image' | 'video'
}): UploadFailureClassification {
  if (error instanceof ValidationError) {
    return {code: error.code, retryable: false, kind: 'validation'}
  }
  if (error instanceof VideoTooLargeError) {
    return {code: 'video-too-large', retryable: false, kind: 'validation'}
  }
  if (error instanceof UploadLimitError) {
    return {
      code: 'video-upload-limit',
      retryable: false,
      kind: 'operational',
      detail: error.message,
    }
  }
  /*
   * A rejected job is never retryable, even when the server's message happens
   * to look like a network error.
   */
  if (
    error instanceof VideoJobError &&
    error.failureCode === 'validation_failure'
  ) {
    return {code: 'video-rejected', retryable: false, kind: 'operational'}
  }
  if (isNetworkError(error) || shouldRetryError(error)) {
    return {code: 'network', retryable: true, kind: 'operational'}
  }
  if (mediaKind === 'image') {
    return {code: 'image-failed', retryable: true, kind: 'unexpected'}
  }
  if (error instanceof VideoJobError) {
    return {
      code: 'video-processing-failed',
      retryable: true,
      kind: 'operational',
    }
  }
  return {code: 'video-failed', retryable: true, kind: 'unexpected'}
}

/** What a worker hands `attempt.reportFailure`, from one classification. */
function failureReport({
  error,
  mediaKind,
}: {
  error: unknown
  mediaKind: 'image' | 'video'
}): {
  status: Extract<UploadStatus, {state: 'failed'}>
  diagnostic: UploadDiagnostic
} {
  const {code, retryable, kind, detail} = classifyUploadError({
    error,
    mediaKind,
  })
  return {
    status: {
      state: 'failed',
      code,
      retryable,
      ...(detail !== undefined && {detail}),
    },
    diagnostic: {kind, cause: error},
  }
}

function throwIfAborted({signal}: {signal: AbortSignal}) {
  if (signal.aborted) throw new AbortError()
}

/** The video service reported a failed or unusable job; exported for the classification test. */
export class VideoJobError extends Error {
  constructor(
    public message: string,
    public failureCode?: string,
  ) {
    super(message)
    this.name = 'VideoJobError'
  }
}
