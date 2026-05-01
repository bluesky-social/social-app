/**
 * Background upload worker.
 *
 * Currently simulated with timers so the rest of the store can be wired up and
 * tested. Each public function kicks off a series of setUploadStatus calls
 * that drive a media item from pending -> uploading (with progress ticks) ->
 * uploaded (or failed).
 *
 * TODO: replace the simulated progression with real AtpAgent.uploadBlob calls
 * for images (via com.atproto.repo.uploadBlob) and the video upload pipeline
 * for videos (job creation + polling). The public surface here should not need
 * to change; the simulation lives entirely inside startImageUpload /
 * startVideoUpload.
 */
import {type AtpAgent, type BlobRef} from '@atproto/api'

import {type UploadStatus} from './types'

type UploadHandle = {
  mediaId: string
  uri: string
  agent: AtpAgent
  setUploadStatus: (mediaId: string, status: UploadStatus) => void
  /** Returns false if the store has been destroyed; aborts in-flight progression. */
  isAlive: () => boolean
}

const IMAGE_PROGRESS_STEPS = [0.25, 0.5, 0.75]
const IMAGE_TICK_MS = 100
const VIDEO_PROGRESS_STEPS = [0.1, 0.3, 0.5, 0.7, 0.9]
const VIDEO_TICK_MS = 200

export function startImageUpload(handle: UploadHandle) {
  // TODO: replace simulation with agent.uploadBlob({...}) and update progress
  // from the underlying request. For now, drip progress then resolve.
  runSimulatedUpload(handle, IMAGE_PROGRESS_STEPS, IMAGE_TICK_MS)
}

export function startVideoUpload(handle: UploadHandle) {
  // TODO: replace simulation with the real video pipeline (compress, create
  // upload job, poll job status, resolve to a BlobRef). Same status contract.
  runSimulatedUpload(handle, VIDEO_PROGRESS_STEPS, VIDEO_TICK_MS)
}

function runSimulatedUpload(
  handle: UploadHandle,
  progressSteps: number[],
  tickMs: number,
) {
  let cancelled = false
  let stepIndex = 0

  function tick() {
    if (cancelled || !handle.isAlive()) return

    if (stepIndex === 0) {
      handle.setUploadStatus(handle.mediaId, {
        state: 'uploading',
        progress: progressSteps[0],
      })
    } else if (stepIndex < progressSteps.length) {
      handle.setUploadStatus(handle.mediaId, {
        state: 'uploading',
        progress: progressSteps[stepIndex],
      })
    } else {
      handle.setUploadStatus(handle.mediaId, {
        state: 'uploaded',
        blob: makePlaceholderBlobRef(),
      })
      return
    }

    stepIndex += 1
    setTimeout(tick, tickMs)
  }

  setTimeout(tick, tickMs)
}

/**
 * Placeholder until the real upload returns a BlobRef from the server.
 * Shape matches @atproto/api's BlobRef; the inner ref is a synthetic CID-like
 * string. Real code path will overwrite this entirely.
 */
function makePlaceholderBlobRef(): BlobRef {
  return {
    $type: 'blob',
    ref: {$link: 'simulated-upload-placeholder'},
    mimeType: 'application/octet-stream',
    size: 0,
  } as unknown as BlobRef
}
