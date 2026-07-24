import {AbortError} from '#/lib/async/cancelable'
import {createProgressAggregator} from './aggregateProgress'
import {MULTIPART_CONCURRENCY, MULTIPART_MAX_ATTEMPTS} from './constants'
import {
  type ChunkReader,
  type PartPlan,
  type PartUploadResult,
  type UploadPartFn,
} from './types'

/**
 * Uploads every part with a concurrency cap and per-part retry, aggregating
 * byte progress into `setProgress`. Reads each chunk lazily just before its
 * upload so only `concurrency` chunks are in memory at once. Resolves with the
 * part results ordered by part number.
 */
export async function uploadParts({
  parts,
  reader,
  uploadPart,
  totalBytes,
  setProgress,
  signal,
  concurrency = MULTIPART_CONCURRENCY,
  maxAttempts = MULTIPART_MAX_ATTEMPTS,
}: {
  parts: PartPlan[]
  reader: ChunkReader
  uploadPart: UploadPartFn
  totalBytes: number
  setProgress: (progress: number) => void
  signal: AbortSignal
  concurrency?: number
  maxAttempts?: number
}): Promise<PartUploadResult[]> {
  const reportPartProgress = createProgressAggregator(totalBytes, setProgress)
  const results: PartUploadResult[] = new Array(parts.length)
  const workerController = new AbortController()
  const abortWorkers = () => workerController.abort()
  signal.addEventListener('abort', abortWorkers, {once: true})
  const workerSignal = workerController.signal

  let nextIndex = 0
  async function worker() {
    while (true) {
      if (workerSignal.aborted) {
        throw new AbortError()
      }
      const index = nextIndex++
      if (index >= parts.length) {
        return
      }
      const part = parts[index]
      const chunk = await reader.read(part.offset, part.size)
      results[index] = await uploadPartWithRetry({
        part,
        chunk,
        uploadPart,
        maxAttempts,
        signal: workerSignal,
        onProgress: bytesSent => reportPartProgress(part.partNumber, bytesSent),
      })
    }
  }

  const workers = Array.from(
    {length: Math.min(concurrency, parts.length)},
    () => worker(),
  )
  const settled = await Promise.allSettled(
    workers.map(async workerPromise => {
      try {
        await workerPromise
      } catch (err) {
        workerController.abort()
        throw err
      }
    }),
  )
  signal.removeEventListener('abort', abortWorkers)
  const failure = settled.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )
  if (signal.aborted) throw new AbortError()
  if (failure) throw failure.reason
  return results
}

async function uploadPartWithRetry({
  part,
  chunk,
  uploadPart,
  maxAttempts,
  signal,
  onProgress,
}: {
  part: PartPlan
  chunk: Uint8Array
  uploadPart: UploadPartFn
  maxAttempts: number
  signal: AbortSignal
  onProgress: (bytesSent: number) => void
}): Promise<PartUploadResult> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal.aborted) {
      throw new AbortError()
    }
    try {
      return await uploadPart({part, chunk, onProgress, signal})
    } catch (err) {
      if (signal.aborted) {
        throw new AbortError()
      }
      lastError = err
      if (attempt < maxAttempts) {
        await delay(500 * 2 ** (attempt - 1), signal)
      }
    }
  }
  throw lastError
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new AbortError())
    }
    signal.addEventListener('abort', onAbort, {once: true})
  })
}
