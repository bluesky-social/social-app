import {isNetworkError} from '#/lib/strings/errors'

export async function retry<P>(
  retries: number,
  cond: (err: any) => boolean,
  fn: () => Promise<P>,
): Promise<P> {
  let lastErr
  while (retries > 0) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (cond(e)) {
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
