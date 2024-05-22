import {XRPCError} from '@atproto/xrpc'

import {isNetworkError} from 'lib/strings/errors'

export const RETRYABLE_NETWORK_STATUS_CODES = [
  1, 408, 425, 429, 500, 502, 503, 504, 522, 524,
]

export const DEFAULT_BACKOFF_DELAY = 500

function isRetryableError(e: unknown) {
  if (e instanceof XRPCError) {
    if (RETRYABLE_NETWORK_STATUS_CODES.includes(e.status)) {
      return true
    }
  }

  return isNetworkError(e)
}

function computeBackoff({
  exception: e,
  retryCount,
}: {
  exception: any
  retryCount: number
}) {
  if (e instanceof XRPCError) {
    if (e.status === 429) {
      const retryAfter = parseInt(
        e.headers?.['Retry-After'] || e.headers?.['retry-after'] || '',
      )
      if (typeof retryAfter === 'number' && !Number.isNaN(retryAfter)) {
        return retryAfter * 1000
      }
    }
  }

  return DEFAULT_BACKOFF_DELAY * Math.pow(2, retryCount)
}

export async function retry<P>(
  fn: () => Promise<P>,
  {
    retries: retriesRemaining,
    checkIsRetryableError = isRetryableError,
    backoff,
  }: {
    retries: number
    checkIsRetryableError?: (err: any) => boolean
    backoff?: boolean
  },
): Promise<P> {
  let lastErr
  let retryCount = 0
  let backoffDelay = DEFAULT_BACKOFF_DELAY

  while (retriesRemaining > 0) {
    try {
      if (retryCount > 0 && backoff) {
        await sleep(backoffDelay)
      }

      return await fn()
    } catch (e: any) {
      lastErr = e

      if (checkIsRetryableError(e)) {
        backoffDelay = computeBackoff({
          exception: e,
          retryCount: retryCount,
        })
        retryCount++
        retriesRemaining--
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
  options: {
    backoff?: boolean
  },
): Promise<P> {
  return retry(fn, {
    retries,
    backoff: options.backoff,
  })
}

export function sleep(time: number) {
  return new Promise(y => setTimeout(y, time))
}
