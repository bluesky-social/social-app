import {XRPCError} from '@atproto/xrpc'

import {isNetworkError} from 'lib/strings/errors'

export const RETRYABLE_NETWORK_STATUS_CODES = [
  1, 408, 425, 429, 500, 502, 503, 504, 522, 524,
]

function isRetryableError(e: unknown) {
  if (e instanceof XRPCError) {
    if (RETRYABLE_NETWORK_STATUS_CODES.includes(e.status)) {
      return true
    }
  }

  return isNetworkError(e)
}

export async function retry<P>(
  fn: () => Promise<P>,
  {
    retries,
    checkIsRetryableError = isRetryableError,
  }: {
    retries: number
    checkIsRetryableError?: (err: any) => boolean
  },
): Promise<P> {
  let lastErr
  while (retries > 0) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (checkIsRetryableError(e)) {
        retries--
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
): Promise<P> {
  return retry(fn, {
    retries,
  })
}
