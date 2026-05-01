/**
 * Background upload worker for the ComposerV2 store.
 *
 * Currently simulated with timers so the rest of the store can be wired up and
 * tested. Each public function returns an UploadTask whose `cancel()` aborts
 * any pending work; this is what the store stores per-media so it can cancel
 * an in-flight upload when the user removes or replaces the media.
 *
 * TODO: replace the simulated progression with real AtpAgent.uploadBlob calls
 * (com.atproto.repo.uploadBlob) for images. The public surface here should
 * not need to change; the simulation lives entirely inside startImageUpload.
 */
import {type AtpAgent, type BlobRef} from '@atproto/api'

import {type UploadStatus} from './types'

export type UploadTask = {
  cancel(): void
}

type StartImageUploadOptions = {
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

export function startImageUpload(opts: StartImageUploadOptions): UploadTask {
  let cancelled = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let stepIndex = 0

  function tick() {
    timeoutId = null
    if (cancelled) return

    if (stepIndex < IMAGE_PROGRESS_STEPS.length) {
      opts.setUploadStatus(opts.postId, opts.mediaId, {
        state: 'uploading',
        progress: IMAGE_PROGRESS_STEPS[stepIndex],
      })
      stepIndex += 1
      timeoutId = setTimeout(tick, IMAGE_TICK_MS)
      return
    }

    opts.setUploadStatus(opts.postId, opts.mediaId, {
      state: 'uploaded',
      blob: makePlaceholderBlobRef(),
    })
  }

  timeoutId = setTimeout(tick, IMAGE_TICK_MS)

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
