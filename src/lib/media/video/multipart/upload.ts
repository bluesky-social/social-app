import {type AppBskyVideoDefs, type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {AbortError} from '#/lib/async/cancelable'
import {type CompressedVideo} from '#/lib/media/video/types'
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
import {MULTIPART_FINISH_ATTEMPTS} from './constants'
import {getMissingParts, planParts} from './planParts'
import {createChunkReader} from './readChunk'
import {createUploadPart} from './uploadPart'
import {uploadParts} from './uploadParts'

export class MultipartFallbackError extends Error {}

export async function uploadVideoMultipart({
  video,
  agent,
  setProgress,
  signal,
  onStarted,
}: {
  video: CompressedVideo
  agent: AtpAgent
  setProgress: (progress: number) => void
  signal: AbortSignal
  onStarted?: () => void
}): Promise<AppBskyVideoDefs.JobStatus> {
  throwIfAborted(signal)
  const tokenProvider = createTokenProvider(agent)
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

    // Finish stores this credential for the later PDS blob upload, so use a
    // fresh token rather than the one that may have aged during transfer.
    await tokenProvider.get(true)
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
  getToken: () => Promise<string>
  signal: AbortSignal
  resendMissingParts: (receivedPartNumbers: number[]) => Promise<boolean>
}): Promise<AppBskyVideoDefs.JobStatus> {
  let createdFailures = 0
  while (true) {
    throwIfAborted(signal)
    const token = await getToken()
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
          // Finalization owns the reservation and may already have assembled
          // the object. Retrying is idempotent; legacy fallback is unsafe.
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
      if (!isRetryableStatusError(err)) throw err
      lastError = err
      if (attempt < 3) await delay(500 * 2 ** (attempt - 1), signal)
    }
  }
  throw lastError
}

function isRetryableStatusError(err: unknown) {
  return (
    err instanceof TypeError ||
    (err instanceof MultipartUploadError &&
      (err.error === 'ServiceOverloaded' ||
        err.status === undefined ||
        err.status >= 500))
  )
}

async function abortThenFallbackOrResolve(
  jobId: string,
  token: string,
  cause: unknown,
): Promise<AppBskyVideoDefs.JobStatus> {
  const result = await abortUpload(jobId, token)
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

function createTokenProvider(agent: AtpAgent) {
  let token: string | undefined
  let expiresAt = 0
  let refresh: Promise<string> | undefined

  async function get(forceRefresh = false) {
    if (!forceRefresh && token && Date.now() < expiresAt - 60_000) return token
    if (!refresh) {
      const exp = Math.floor(Date.now() / 1000) + 60 * 30
      refresh = getServiceAuthToken({
        agent,
        lxm: 'com.atproto.repo.uploadBlob',
        exp,
      })
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

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new AbortError()
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
