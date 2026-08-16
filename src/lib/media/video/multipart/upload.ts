import {type Client} from '@atproto/lex'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {type CompressedVideo} from '#/lib/media/video/types'
import {shouldRetryError} from '#/lib/strings/errors'
import {type app} from '#/lexicons'
import {getServiceAuthToken} from '../upload.shared'
import {mimeToExt} from '../util'
import {
  abortUpload,
  completedStatus,
  finishUpload,
  getUploadStatus,
  MultipartUploadError,
  startUpload,
} from './api'
import {
  MULTIPART_ABORT_ATTEMPTS,
  MULTIPART_ABORT_TIMEOUT_MS,
  MULTIPART_FINISH_ATTEMPTS,
} from './constants'
import {getMissingParts, planParts} from './planParts'
import {createChunkReader} from './readChunk'
import {createUploadPart} from './uploadPart'
import {uploadParts} from './uploadParts'
import {delay, isRetryableMultipartError, retryDelayMs} from './utils'

export class MultipartFallbackError extends Error {}

export async function uploadVideoMultipart({
  video,
  client,
  dispatchUrl,
  setProgress,
  signal,
  onStarted,
}: {
  video: CompressedVideo
  client: Client
  /** The account's PDS/dispatch URL, for the uploadBlob service-auth token. */
  dispatchUrl: string | URL
  setProgress: (progress: number) => void
  signal: AbortSignal
  onStarted?: () => void
}): Promise<app.bsky.video.defs.JobStatus> {
  throwIfAborted(signal)
  const tokenProvider = createTokenProvider(client, dispatchUrl, signal)
  const token = await tokenProvider.get()
  const name = `${nanoid(12)}.${mimeToExt(video.mimeType)}`
  let session
  try {
    session = await startUpload({token, video, name, signal})
  } catch (err) {
    if (signal.aborted) throw new AbortError()
    // A server without multipart support, or one with the kill switch active,
    // leaves no reservation behind. The legacy path remains authoritative.
    throw new MultipartFallbackError(
      err instanceof Error ? err.message : 'Multipart upload unavailable',
    )
  }
  onStarted?.()

  const {jobId} = session
  const abortOnCancel = () => {
    void tokenProvider
      .get()
      .then(currentToken => abortUpload(jobId, currentToken))
      .catch(() => {})
  }
  signal.addEventListener('abort', abortOnCancel, {once: true})
  let reader: ReturnType<typeof createChunkReader> | undefined
  // Kept outside the upload try block for finish-time missing-part recovery.
  let parts: ReturnType<typeof planParts> = []
  try {
    try {
      reader = createChunkReader(video)
      parts = planParts(video.size, session.partSizeBytes)
      if (parts.length !== session.partCount) {
        throw new Error('Video service returned an invalid multipart plan')
      }
      await uploadParts({
        parts,
        reader,
        uploadPart: createUploadPart(jobId, tokenProvider.get),
        totalBytes: video.size,
        setProgress,
        signal,
      })
    } catch (err) {
      if (signal.aborted) throw new AbortError()
      return await abortThenFallbackOrResolve(
        jobId,
        await tokenProvider.get(),
        err,
      )
    }

    // Preserve TypeScript's narrowing inside the recovery callback.
    const activeReader = reader
    if (!activeReader) throw new Error('Video chunk reader is unavailable')
    return await finishAndRecover({
      jobId,
      getToken: tokenProvider.get,
      signal,
      resendMissingParts: async receivedPartNumbers => {
        const missing = getMissingParts(parts, receivedPartNumbers)
        if (missing.length === 0) return false
        const missingBytes = missing.reduce((sum, part) => sum + part.size, 0)
        const completedBytes = video.size - missingBytes
        await uploadParts({
          parts: missing,
          reader: activeReader,
          uploadPart: createUploadPart(jobId, tokenProvider.get),
          totalBytes: missingBytes,
          setProgress: progress =>
            setProgress(
              (completedBytes + progress * missingBytes) / video.size,
            ),
          signal,
        })
        return true
      },
    })
  } finally {
    reader?.close()
    signal.removeEventListener('abort', abortOnCancel)
  }
}

async function finishAndRecover({
  jobId,
  getToken,
  signal,
  resendMissingParts,
}: {
  jobId: string
  getToken: (forceRefresh?: boolean) => Promise<string>
  signal: AbortSignal
  resendMissingParts: (receivedPartNumbers: number[]) => Promise<boolean>
}): Promise<app.bsky.video.defs.JobStatus> {
  let createdFailures = 0
  let forceTokenRefresh = true
  while (true) {
    throwIfAborted(signal)
    // Finish stores this credential for the later PDS blob upload. Refresh it
    // once after part transfer, then reuse it while polling/recovering.
    const token = await getToken(forceTokenRefresh)
    forceTokenRefresh = false
    try {
      const result = await finishUpload(jobId, token, signal)
      return result.jobStatus
    } catch (finishError) {
      throwIfAborted(signal)
      const status = await getUploadStatusWithRetry(jobId, token, signal)
      const completed = completedStatus(status)
      if (completed) return completed.jobStatus

      switch (status.state) {
        case 'created':
          try {
            const resentParts = await resendMissingParts(status.receivedParts)
            if (resentParts) {
              createdFailures = 0
              continue
            }
          } catch (err) {
            throwIfAborted(signal)
            return await abortThenFallbackOrResolve(jobId, token, err)
          }
          createdFailures++
          if (createdFailures < MULTIPART_FINISH_ATTEMPTS) {
            await delay(500 * 2 ** (createdFailures - 1), signal)
            continue
          }
          return await abortThenFallbackOrResolve(jobId, token, finishError)
        case 'finishing':
          // The service may have assembled the upload even though the finish
          // request failed. Poll and retry instead of starting a second upload.
          await delay(1000, signal)
          continue
        case 'failed':
          throw new MultipartUploadError(
            status.failureReason || 'Multipart upload failed',
            'UploadFailed',
          )
        case 'aborted':
        case 'expired':
          throw new MultipartUploadError(
            `Multipart upload ${status.state}`,
            status.state === 'aborted' ? 'UploadAborted' : 'UploadExpired',
          )
        case 'completed':
          throw new MultipartUploadError(
            'Multipart upload completed without a job status',
            'InvalidUploadStatus',
          )
        default:
          throw new MultipartUploadError(
            'Multipart upload returned an unknown status',
            'InvalidUploadStatus',
          )
      }
    }
  }
}

async function getUploadStatusWithRetry(
  jobId: string,
  token: string,
  signal: AbortSignal,
) {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await getUploadStatus(jobId, token, signal)
    } catch (err) {
      throwIfAborted(signal)
      if (!isRetryableMultipartError(err)) throw err
      lastError = err
      if (attempt < 3) await delay(500 * 2 ** (attempt - 1), signal)
    }
  }
  throw lastError
}

async function abortThenFallbackOrResolve(
  jobId: string,
  token: string,
  cause: unknown,
): Promise<app.bsky.video.defs.JobStatus> {
  const result = await abortUploadWithRetry(jobId, token)
  if (result.state === 'aborted') {
    throw new MultipartFallbackError(
      cause instanceof Error ? cause.message : 'Multipart upload failed',
    )
  }
  if (result.state === 'completed' && result.completedJobId) {
    const status = await getUploadStatus(jobId, token)
    const completed = completedStatus(status)
    if (completed) return completed.jobStatus
  }
  throw new MultipartUploadError(
    result.failureReason || `Multipart upload ${result.state}`,
    result.state === 'failed' ? 'UploadFailed' : undefined,
  )
}

async function abortUploadWithRetry(jobId: string, token: string) {
  let lastError: unknown
  for (let attempt = 1; attempt <= MULTIPART_ABORT_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      MULTIPART_ABORT_TIMEOUT_MS,
    )
    try {
      return await abortUpload(jobId, token, controller.signal)
    } catch (err) {
      lastError = err
      if (attempt < MULTIPART_ABORT_ATTEMPTS) {
        await delay(retryDelayMs(attempt), new AbortController().signal)
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

function createTokenProvider(
  client: Client,
  dispatchUrl: string | URL,
  signal: AbortSignal,
) {
  let token: string | undefined
  let expiresAt = 0
  let refresh: Promise<string> | undefined

  async function get(forceRefresh = false) {
    if (!forceRefresh && token && Date.now() < expiresAt - 60_000) return token
    if (!refresh) {
      const exp = Math.floor(Date.now() / 1000) + 60 * 30
      refresh = getServiceAuthTokenWithRetry(client, dispatchUrl, exp, signal)
        .then(nextToken => {
          token = nextToken
          expiresAt = exp * 1000
          return nextToken
        })
        .finally(() => {
          refresh = undefined
        })
    }
    return refresh
  }

  return {get}
}

async function getServiceAuthTokenWithRetry(
  client: Client,
  dispatchUrl: string | URL,
  exp: number,
  signal: AbortSignal,
) {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    throwIfAborted(signal)
    try {
      return await getServiceAuthToken({
        client,
        dispatchUrl,
        lxm: 'com.atproto.repo.uploadBlob',
        exp,
      })
    } catch (err) {
      throwIfAborted(signal)
      if (!(err instanceof TypeError) && !shouldRetryError(err)) throw err
      lastError = err
      if (attempt < 3) await delay(500 * 2 ** (attempt - 1), signal)
    }
  }
  throw lastError
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new AbortError()
}
