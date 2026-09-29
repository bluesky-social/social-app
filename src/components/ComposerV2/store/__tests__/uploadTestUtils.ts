import {type BlobRef} from '@atproto/lex'
import {jest} from '@jest/globals'

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

function simulated({
  steps,
  tickMs,
  ...opts
}: {
  postId: string
  mediaId: string
  setUploadStatus: (
    postId: string,
    mediaId: string,
    status: UploadStatus,
  ) => void
  steps: number[]
  tickMs: number
}): UploadTask {
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

/** Keeps callbacks callable after cancellation to exercise store-side ownership. */
export function manualUploadWorkers() {
  type Options =
    | Parameters<NonNullable<UploadWorkerOverrides['startImageUpload']>>[0]
    | Parameters<NonNullable<UploadWorkerOverrides['startVideoUpload']>>[0]
  const attempts: Array<
    Options & {
      cancel: jest.Mock
      report: (status: UploadStatus) => void
    }
  > = []
  const start = (options: Options) => {
    const attempt = {
      ...options,
      cancel: jest.fn(),
      report: (status: UploadStatus) =>
        options.setUploadStatus(options.postId, options.mediaId, status),
    }
    attempts.push(attempt)
    return {cancel: attempt.cancel}
  }
  const workers: UploadWorkerOverrides = {
    startImageUpload: start,
    startVideoUpload: start,
  }
  return {attempts, workers}
}

export const simulatedUploadWorkers: UploadWorkerOverrides = {
  startImageUpload: opts =>
    simulated({...opts, steps: [0.25, 0.5, 0.75], tickMs: 100}),
  startVideoUpload: opts =>
    simulated({...opts, steps: [0.1, 0.3, 0.5, 0.7, 0.9], tickMs: 200}),
}
