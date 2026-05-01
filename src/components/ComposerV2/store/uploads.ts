/**
 * Background upload worker for the ComposerV2 store.
 *
 * Currently simulated with timers so the rest of the store can be wired up and
 * tested. Each public function returns an UploadTask whose `cancel()` aborts
 * any pending work; this is what the store stores per-media so it can cancel
 * an in-flight upload when the user removes or replaces the media.
 *
 * TODO: replace the simulated progression with real implementations:
 *   - images: AtpAgent.uploadBlob (com.atproto.repo.uploadBlob)
 *   - video: the existing video pipeline (compress, create upload job, poll
 *     until ready, resolve to a BlobRef)
 * The public surface here (startImageUpload / startVideoUpload returning an
 * UploadTask) should not need to change; the simulation lives entirely
 * inside runSimulatedUpload.
 */
import {type AtpAgent, type BlobRef} from '@atproto/api'

import {type UploadStatus} from './types'

export type UploadTask = {
  cancel(): void
}

type StartUploadOptions = {
  postId: string
  mediaId: string
  uri: string
  agent: AtpAgent
  setUploadStatus: (
    postId: string,
    mediaId: string,
    status: UploadStatus,
  ) => void
}

const IMAGE_PROGRESS_STEPS = [0.25, 0.5, 0.75]
const IMAGE_TICK_MS = 100
const VIDEO_PROGRESS_STEPS = [0.1, 0.3, 0.5, 0.7, 0.9]
const VIDEO_TICK_MS = 200

export function startImageUpload(opts: StartUploadOptions): UploadTask {
  return runSimulatedUpload(opts, IMAGE_PROGRESS_STEPS, IMAGE_TICK_MS)
}

export function startVideoUpload(opts: StartUploadOptions): UploadTask {
  // TODO: replace with real video pipeline (compress, create upload job,
  // poll until ready, resolve to a BlobRef).
  return runSimulatedUpload(opts, VIDEO_PROGRESS_STEPS, VIDEO_TICK_MS)
}

function runSimulatedUpload(
  opts: StartUploadOptions,
  progressSteps: number[],
  tickMs: number,
): UploadTask {
  let cancelled = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let stepIndex = 0

  function tick() {
    timeoutId = null
    if (cancelled) return

    if (stepIndex < progressSteps.length) {
      opts.setUploadStatus(opts.postId, opts.mediaId, {
        state: 'uploading',
        progress: progressSteps[stepIndex],
      })
      stepIndex += 1
      timeoutId = setTimeout(tick, tickMs)
      return
    }

    opts.setUploadStatus(opts.postId, opts.mediaId, {
      state: 'uploaded',
      blob: makePlaceholderBlobRef(),
    })
  }

  timeoutId = setTimeout(tick, tickMs)

  return {
    cancel() {
      if (cancelled) return
      cancelled = true
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    },
  }
}

/**
 * Placeholder until the real upload returns a BlobRef from the server.
 * Real code path will overwrite this entirely.
 */
function makePlaceholderBlobRef(): BlobRef {
  return {
    $type: 'blob',
    ref: {$link: 'simulated-upload-placeholder'},
    mimeType: 'application/octet-stream',
    size: 0,
  } as unknown as BlobRef
}
