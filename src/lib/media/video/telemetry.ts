import {Platform} from 'react-native'
import {type ImagePickerAsset} from 'expo-image-picker'

import {Sentry} from '#/logger/sentry/lib'
import {type Metrics} from '#/analytics/metrics'

type MetricFn = <E extends keyof Metrics>(event: E, payload: Metrics[E]) => void

// Identifies the active compression engine. Bumped when the engine swaps.
// Versions are intentionally hardcoded so a dependency bump shows up in
// analytics as a label change.
const COMPRESS_ENGINE =
  Platform.OS === 'web'
    ? 'web:mediabunny@1.25.3'
    : 'native:react-native-compressor@1.13.0'

type Phase = 'compress' | 'upload' | 'processing'

type SkipReason =
  | 'gif'
  | 'below-threshold'
  | 'no-webcodecs'
  | 'compress-error-fallback'

function makeUploadId(): string {
  const c = (globalThis as {crypto?: {randomUUID?: () => string}}).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `up_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

function errorClass(e: unknown): string {
  if (e instanceof Error) return e.name || 'Error'
  return 'Unknown'
}

export type VideoTelemetry = {
  readonly uploadId: string
  readonly engine: string
  picked: () => void
  compressStarted: () => void
  compressSkipped: (video: {
    size: number
    mimeType: string
    reason: SkipReason
  }) => void
  compressCompleted: (video: {size: number; mimeType: string}) => void
  compressFailed: (e: unknown) => void
  uploadStarted: (bytes: number) => void
  uploadCompleted: (jobId: string) => void
  uploadFailed: (e: unknown) => void
  processingStarted: (jobId: string) => void
  processingCompleted: () => void
  processingFailed: (e: unknown) => void
  published: () => void
}

export function createVideoTelemetry({
  asset,
  signal,
  metric,
}: {
  asset: ImagePickerAsset
  signal: AbortSignal
  metric: MetricFn
}): VideoTelemetry {
  const uploadId = makeUploadId()
  const engine = COMPRESS_ENGINE
  const startedAt = Date.now()

  let phase: Phase | undefined
  let phaseStartedAt = startedAt
  let jobId: string | undefined
  let uploadBytes: number | undefined
  let txnEnded = false
  let abortBound = true

  // Parent span: full selection->ready arc. Inactive so phase spans can be
  // attached as children regardless of the current async context.
  const txn = Sentry.startInactiveSpan({
    name: 'video.upload',
    op: 'video.upload',
    attributes: {
      uploadId,
      engine,
      'video.source.mime': asset.mimeType ?? 'unknown',
      'video.source.bytes': asset.fileSize ?? 0,
      'video.source.durationMs': asset.duration ?? 0,
      'video.source.width': asset.width ?? 0,
      'video.source.height': asset.height ?? 0,
    },
  })

  let phaseSpan: ReturnType<typeof Sentry.startInactiveSpan> | undefined

  function endPhaseSpan() {
    if (!phaseSpan) return
    phaseSpan.end()
    phaseSpan = undefined
  }

  function enterPhase(next: Phase, spanName: string) {
    endPhaseSpan()
    phase = next
    phaseStartedAt = Date.now()
    phaseSpan = Sentry.withActiveSpan(txn, () =>
      Sentry.startInactiveSpan({
        name: spanName,
        op: spanName,
        attributes: {uploadId, engine},
      }),
    )
  }

  function endTxn(outcome: 'ok' | 'error' | 'cancelled') {
    if (txnEnded) return
    txnEnded = true
    endPhaseSpan()
    txn.setAttribute('outcome', outcome)
    txn.end()
  }

  function detachAbort() {
    if (!abortBound) return
    abortBound = false
    signal.removeEventListener('abort', onAbort)
  }

  function onAbort() {
    if (phase) {
      metric('video:upload:abandoned', {
        uploadId,
        engine,
        phase,
        jobId,
        elapsedInPhaseMs: Date.now() - phaseStartedAt,
      })
    }
    endTxn('cancelled')
    abortBound = false
  }
  signal.addEventListener('abort', onAbort, {once: true})

  return {
    uploadId,
    engine,

    picked() {
      metric('video:upload:picked', {
        uploadId,
        engine,
        sourceMimeType: asset.mimeType,
        sourceBytes: asset.fileSize,
        sourceDurationMs: asset.duration ?? undefined,
        sourceWidth: asset.width,
        sourceHeight: asset.height,
      })
    },

    compressStarted() {
      enterPhase('compress', 'video.compress')
      metric('video:upload:compressStarted', {
        uploadId,
        engine,
        sourceBytes: asset.fileSize,
      })
    },

    compressSkipped({size, mimeType, reason}) {
      metric('video:upload:compressSkipped', {
        uploadId,
        engine,
        reason,
        bytes: size,
        mimeType,
        elapsedMs: Date.now() - phaseStartedAt,
      })
      endPhaseSpan()
      phase = undefined
    },

    compressCompleted({size, mimeType}) {
      metric('video:upload:compressCompleted', {
        uploadId,
        engine,
        bytesIn: asset.fileSize,
        bytesOut: size,
        outputMimeType: mimeType,
        elapsedMs: Date.now() - phaseStartedAt,
      })
      endPhaseSpan()
      phase = undefined
    },

    compressFailed(e) {
      metric('video:upload:compressFailed', {
        uploadId,
        engine,
        errorClass: errorClass(e),
        elapsedMs: Date.now() - phaseStartedAt,
      })
      endTxn('error')
      detachAbort()
    },

    uploadStarted(bytes) {
      uploadBytes = bytes
      enterPhase('upload', 'video.upload.transfer')
      metric('video:upload:uploadStarted', {uploadId, engine, bytes})
    },

    uploadCompleted(id) {
      jobId = id
      const elapsedMs = Date.now() - phaseStartedAt
      const bytes = uploadBytes ?? 0
      metric('video:upload:uploadCompleted', {
        uploadId,
        engine,
        jobId: id,
        bytes,
        elapsedMs,
        throughputBytesPerSec:
          elapsedMs > 0 ? Math.round((bytes * 1000) / elapsedMs) : 0,
      })
      endPhaseSpan()
      phase = undefined
    },

    uploadFailed(e) {
      metric('video:upload:uploadFailed', {
        uploadId,
        engine,
        bytes: uploadBytes ?? 0,
        errorClass: errorClass(e),
        elapsedMs: Date.now() - phaseStartedAt,
      })
      endTxn('error')
      detachAbort()
    },

    processingStarted(id) {
      jobId = id
      enterPhase('processing', 'video.processing')
      metric('video:upload:processingStarted', {uploadId, engine, jobId: id})
    },

    processingCompleted() {
      metric('video:upload:processingCompleted', {
        uploadId,
        engine,
        jobId: jobId ?? '',
        elapsedMs: Date.now() - phaseStartedAt,
      })
      // Upload pipeline is done; publish is a separate user action that
      // fires its own event. Releases the parent span so its duration
      // measures upload work, not idle composer time.
      endTxn('ok')
      detachAbort()
    },

    processingFailed(e) {
      metric('video:upload:processingFailed', {
        uploadId,
        engine,
        jobId: jobId ?? '',
        errorClass: errorClass(e),
        elapsedMs: Date.now() - phaseStartedAt,
      })
      endTxn('error')
      detachAbort()
    },

    published() {
      metric('video:upload:published', {
        uploadId,
        engine,
        jobId: jobId ?? '',
        totalElapsedMs: Date.now() - startedAt,
      })
    },
  }
}
