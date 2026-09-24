import {timeout} from './timeout'

/**
 * Retries an async operation until its result or error matches `cond`.
 */
export async function until<T>(
  retries: number,
  delay: number,
  cond: (v: T | undefined, err: unknown) => boolean,
  fn: () => Promise<T>,
): Promise<boolean> {
  while (retries > 0) {
    try {
      const v = await fn()
      if (cond(v, undefined)) {
        return true
      }
    } catch (err) {
      if (cond(undefined, err)) {
        return true
      }
    }
    await timeout(delay)
    retries--
  }
  return false
}
