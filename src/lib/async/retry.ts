import {timeout} from '#/lib/async/timeout'
import {isNetworkError, shouldRetryError} from '#/lib/strings/errors'

type RetryDelay = number | ((attempt: number) => number)

export function exponentialBackoffRetryDelay(attempt: number) {
  return Math.min(1000 * 2 ** attempt, 30_000)
}

export function isRetryableRequestError(error: unknown) {
  return isNetworkError(error) || shouldRetryError(error)
}

export async function retry<P>(
  retries: number,
  shouldRetry: (err: any) => boolean,
  action: () => Promise<P>,
  delay?: RetryDelay,
): Promise<P> {
  let lastErr
  let attempt = 0
  while (retries > 0) {
    try {
      return await action()
    } catch (e: any) {
      lastErr = e
      if (shouldRetry(e)) {
        retries--
        if (retries === 0) throw e
        const delayMs = typeof delay === 'function' ? delay(attempt) : delay
        if (delayMs) await timeout(delayMs)
        attempt++
        continue
      }
      throw e
    }
  }
  throw lastErr
}

export async function networkRetry<P>(
  retries: number,
  fn: () => Promise<P>,
  delay?: RetryDelay,
): Promise<P> {
  return retry(retries, isNetworkError, fn, delay)
}

export async function requestRetry<P>(
  retries: number,
  fn: () => Promise<P>,
): Promise<P> {
  return retry(
    retries,
    isRetryableRequestError,
    fn,
    exponentialBackoffRetryDelay,
  )
}
