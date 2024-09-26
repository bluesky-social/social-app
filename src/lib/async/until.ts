import {timeout} from './timeout'

export async function until<T>(
  retries: number,
  delay: number,
  cond: (v: T, err: any) => boolean,
  fn: () => Promise<T>,
): Promise<boolean> {
  while (retries > 0) {
    try {
      const v = await fn()
      if (cond(v, undefined)) {
        return true
      }
    } catch (e: any) {
      // TODO: change the type signature of cond to accept undefined
      // however this breaks every existing usage of until -sfn
      if (cond(undefined as unknown as T, e)) {
        return true
      }
    }
    await timeout(delay)
    retries--
  }
  return false
}
