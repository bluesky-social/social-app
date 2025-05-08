import {timeout} from '#/lib/async/timeout'
import {isNetworkError} from '#/lib/strings/errors'

export async function retry<P>(
  retries: number,
  cond: (err: any) => boolean,
  fn: () => Promise<P>,
  delay?: number,
): Promise<P> {
  let lastErr
  while (retries > 0) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      // should retry?
      if (cond(e)) {
        if (delay) {
          await timeout(delay)
        }
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
  return retry(retries, isNetworkError, fn)
}
