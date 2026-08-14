import {AbortError} from '#/lib/async/cancelable'
import {isRetryableHttpStatus} from '#/lib/strings/errors'
import {MultipartUploadError} from './api'

export function isRetryableMultipartError(err: unknown) {
  return (
    err instanceof TypeError ||
    (err instanceof MultipartUploadError &&
      (err.error === 'ServiceOverloaded' ||
        err.status === undefined ||
        isRetryableHttpStatus(err.status)))
  )
}

export function delay(ms: number, signal: AbortSignal) {
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

/** Exponential backoff with 50-100% jitter to avoid synchronized retries. */
export function retryDelayMs(attempt: number) {
  const ceiling = Math.min(500 * 2 ** (attempt - 1), 8_000)
  return ceiling * (0.5 + Math.random() * 0.5)
}
