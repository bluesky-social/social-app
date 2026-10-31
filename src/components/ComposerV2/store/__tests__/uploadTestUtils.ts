import {type BlobRef, type Client} from '@atproto/lex'
import {jest} from '@jest/globals'

import {AbortError} from '#/lib/async/cancelable'
import {type VideoTelemetry} from '#/lib/media/video/telemetry'
import {
  type UploadDiagnostic,
  type UploadRuntime,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadAttempt,
  type ImageUploadDependencies,
  startImageUpload,
  startVideoUpload,
  type UploadAttempt,
  type UploadTask,
  type UploadWorkerOverrides,
  type VideoUploadAttempt,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {type AnalyticsContextType} from '#/analytics'

/** Analytics whose metrics a test can inspect; nothing is sent. */
export function fakeAnalytics() {
  const metric = jest.fn<AnalyticsContextType['metric']>()
  return {metric, analytics: {metric} as unknown as AnalyticsContextType}
}

/**
 * Placeholder account inputs for stores under test. Tests that exercise real
 * workers use `realUploadWorkers` (or call a worker directly with fakes) so
 * nothing reaches the network.
 */
export const testUploadRuntime: UploadRuntime & {
  analytics: AnalyticsContextType
} = {
  pdsClient: {} as Client,
  pdsUrl: 'https://pds.example.test',
  analytics: fakeAnalytics().analytics,
}

/** Telemetry that records nothing, for worker tests that do not assert it. */
export function noopVideoTelemetry(): VideoTelemetry {
  const noop = () => {}
  return {
    uploadId: 'test-upload',
    engine: 'test',
    picked: noop,
    restarted: noop,
    validationFailed: noop,
    compressStarted: noop,
    probed: noop,
    compressSkipped: noop,
    compressCompleted: noop,
    compressFailed: noop,
    uploadStarted: noop,
    uploadCompleted: noop,
    uploadFailed: noop,
    processingStarted: noop,
    processingCompleted: noop,
    processingFailed: noop,
    captionsFailed: noop,
    published: noop,
  }
}

/**
 * An attempt whose every member is a `jest.fn`, for worker tests that assert
 * the calls. Pass overrides for members that must return something.
 */
export function fakeUploadAttempt(
  overrides: Partial<VideoUploadAttempt> = {},
): ImageUploadAttempt & VideoUploadAttempt {
  return {
    reportStatus: jest.fn(),
    reportFailure: jest.fn(),
    setSourceMetadata: jest.fn(),
    setCompressionResult: jest.fn(),
    setCaptionBlobs: jest.fn(),
    acquireCompressedVideo: jest.fn(() => undefined),
    retainCompressedVideo: jest.fn(() => undefined),
    setVideoTelemetry: jest.fn(),
    ...overrides,
  }
}

/**
 * Sends any status through the matching attempt callback. A failure gets the
 * diagnostic the store would otherwise need from the worker, defaulting to
 * `operational` for a retryable failure and `validation` otherwise.
 */
export function reportAnyStatus({
  attempt,
  status,
  diagnostic,
}: {
  attempt: UploadAttempt
  status: UploadStatus
  diagnostic?: UploadDiagnostic
}) {
  if (status.state === 'failed') {
    attempt.reportFailure({
      status,
      diagnostic: diagnostic ?? {
        kind: status.retryable ? 'operational' : 'validation',
        cause: undefined,
      },
    })
  } else {
    attempt.reportStatus({status})
  }
}

const placeholder = {
  $type: 'blob',
  ref: {$link: 'test-upload'},
  mimeType: 'application/octet-stream',
  size: 0,
} as unknown as BlobRef

function simulated({
  attempt,
  steps,
  tickMs,
}: {
  attempt: UploadAttempt
  steps: number[]
  tickMs: number
}): UploadTask {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let index = 0
  const tick = () => {
    if (cancelled) return
    if (index < steps.length) {
      attempt.reportStatus({
        status: {state: 'uploading', progress: steps[index++]},
      })
      timer = setTimeout(tick, tickMs)
    } else {
      attempt.reportStatus({status: {state: 'uploaded', blob: placeholder}})
    }
  }
  timer = setTimeout(tick, tickMs)
  return {
    cancel() {
      cancelled = true
      if (timer) clearTimeout(timer)
    },
  }
}

/** Keeps callbacks callable after cancellation to exercise store-side ownership. */
export function manualUploadWorkers() {
  type Options =
    | Parameters<NonNullable<UploadWorkerOverrides['startImageUpload']>>[0]
    | Parameters<NonNullable<UploadWorkerOverrides['startVideoUpload']>>[0]
  const attempts: Array<
    Options & {
      /**
       * Typed as both kinds so a test can call whichever members its item
       * has; the store gives an image attempt no video members.
       */
      attempt: ImageUploadAttempt & VideoUploadAttempt
      postId: string
      mediaId: string
      cancel: jest.Mock
      report: (status: UploadStatus, diagnostic?: UploadDiagnostic) => void
    }
  > = []
  const start = (options: Options) => {
    const entry = {
      ...options,
      cancel: jest.fn(),
      postId: options.media.postId,
      mediaId: options.media.id,
      report: (status: UploadStatus, diagnostic?: UploadDiagnostic) =>
        reportAnyStatus({attempt: options.attempt, status, diagnostic}),
    }
    attempts.push(entry as (typeof attempts)[number])
    return {cancel: entry.cancel}
  }
  const workers: UploadWorkerOverrides = {
    startImageUpload: start,
    startVideoUpload: start,
  }
  return {attempts, workers}
}

export const simulatedUploadWorkers: UploadWorkerOverrides = {
  startImageUpload: ({attempt}) =>
    simulated({attempt, steps: [0.25, 0.5, 0.75], tickMs: 100}),
  startVideoUpload: ({attempt}) =>
    simulated({attempt, steps: [0.1, 0.3, 0.5, 0.7, 0.9], tickMs: 200}),
}

/** A dependency the test does not expect the worker to reach. */
function unexpected(name: string) {
  return jest.fn(() => {
    throw new Error(`Unexpected ${name} call`)
  }) as never
}

/**
 * Unbounded stand-in for the compression limiter that keeps the real
 * already-aborted contract. Tests of the cap pass a real
 * `createConcurrencyLimit` instead; never the production singleton.
 */
const unboundedImageCompression: ImageUploadDependencies['limitImageCompression'] =
  ({task, signal}) =>
    signal.aborted ? Promise.reject(new AbortError()) : task()

/** Complete image-worker fakes; pass the dependencies a test exercises. */
export function fakeImageDependencies(
  overrides: Partial<ImageUploadDependencies> = {},
): ImageUploadDependencies {
  return {
    getImageDimensions: unexpected('getImageDimensions'),
    compressImage: unexpected('compressImage'),
    uploadBlob: unexpected('uploadBlob'),
    releaseCompressedImage:
      jest.fn<ImageUploadDependencies['releaseCompressedImage']>(),
    limitImageCompression: unboundedImageCompression,
    ...overrides,
  }
}

/** Complete video-worker fakes; pass the dependencies a test exercises. */
export function fakeVideoDependencies(
  overrides: Partial<VideoUploadDependencies> = {},
): VideoUploadDependencies {
  return {
    getVideoMetadata: unexpected('getVideoMetadata'),
    getImageDimensions: unexpected('getImageDimensions'),
    getFileSize: unexpected('getFileSize'),
    copyVideoToCache: unexpected('copyVideoToCache'),
    createVideoTelemetry: noopVideoTelemetry,
    compressVideo: unexpected('compressVideo'),
    uploadVideo: unexpected('uploadVideo'),
    releaseCompressedVideo:
      jest.fn<VideoUploadDependencies['releaseCompressedVideo']>(),
    uploadBlob: unexpected('uploadBlob'),
    createVideoServiceClient: unexpected('createVideoServiceClient'),
    sleep: unexpected('sleep'),
    ...overrides,
  }
}

/**
 * The real workers for `__uploadWorkers`, with the store's production
 * dependencies replaced by complete fakes.
 */
export function realUploadWorkers({
  image,
  video,
}: {
  image?: Partial<ImageUploadDependencies>
  video?: Partial<VideoUploadDependencies>
}): UploadWorkerOverrides {
  return {
    startImageUpload: opts =>
      startImageUpload({...opts, ...fakeImageDependencies(image)}),
    startVideoUpload: opts =>
      startVideoUpload({...opts, ...fakeVideoDependencies(video)}),
  }
}
