import {XRPCError} from '@atproto/xrpc'

import {isNetworkError} from 'lib/strings/errors'

export const NETWORK_FAILURE_STATUSES = [
  1, 408, 425, 429, 500, 502, 503, 504, 522, 524,
]

function isRetryable(e: unknown) {
  if (e instanceof XRPCError) {
    if (NETWORK_FAILURE_STATUSES.includes(e.status)) {
      return true
    }
  }

  return isNetworkError(e)
}

export async function retry<P>(
  fn: () => Promise<P>,
  {
    retries,
    checkIsRetryable = isRetryable,
  }: {
    retries: number
    checkIsRetryable?: (err: any) => boolean
  },
): Promise<P> {
  let lastErr
  while (retries > 0) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (checkIsRetryable(e)) {
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
