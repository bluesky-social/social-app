import {type BlobRef} from '@atproto/lex'

import {type UploadStatus} from '#/components/ComposerV2/store/types'
import {
  type UploadTask,
  type UploadWorkerOverrides,
} from '#/components/ComposerV2/store/uploads'

const placeholder = {
  $type: 'blob',
  ref: {$link: 'test-upload'},
  mimeType: 'application/octet-stream',
  size: 0,
} as unknown as BlobRef

function simulated(
  opts: {
    postId: string
    mediaId: string
    setUploadStatus: (
      postId: string,
      mediaId: string,
      status: UploadStatus,
    ) => void
  },
  steps: number[],
  tickMs: number,
): UploadTask {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let index = 0
  const tick = () => {
    if (cancelled) return
    if (index < steps.length) {
      opts.setUploadStatus(opts.postId, opts.mediaId, {
        state: 'uploading',
        progress: steps[index++],
      })
      timer = setTimeout(tick, tickMs)
    } else {
      opts.setUploadStatus(opts.postId, opts.mediaId, {
        state: 'uploaded',
        blob: placeholder,
      })
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

export const simulatedUploadWorkers: UploadWorkerOverrides = {
  startImageUpload: opts => simulated(opts, [0.25, 0.5, 0.75], 100),
  startVideoUpload: opts => simulated(opts, [0.1, 0.3, 0.5, 0.7, 0.9], 200),
}
