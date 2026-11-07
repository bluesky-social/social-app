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
  /** Attempts the store has not cancelled. */
  const uncancelled = () =>
    attempts.filter(attempt => attempt.cancel.mock.calls.length === 0)
  return {attempts, workers, uncancelled}
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

/**
 * A `createVideoServiceClient` whose `getJobStatus` reports a finished job with
 * `blob`. The worker takes a video's blob only from polling, so tests that
 * expect an `uploaded` video need one of these (or a real job poll).
 */
export function completedJobClient({
  blob,
  jobId = 'job-1',
}: {
  blob: BlobRef
  jobId?: string
}) {
  const call = jest.fn((_method: unknown, _params: unknown) =>
    Promise.resolve({jobStatus: {state: 'JOB_STATE_COMPLETED', jobId, blob}}),
  )
  const createClient = () => ({call})
  return Object.assign(createClient, {
    call,
  }) as unknown as VideoUploadDependencies['createVideoServiceClient'] & {
    call: typeof call
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

/** Waits one macrotask so all pending promise work settles. */
export function flush() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}
