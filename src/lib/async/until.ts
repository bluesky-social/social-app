import {timeout} from './timeout'

export async function until(
  retries: number,
  delay: number,
  cond: (v: any, err: any) => boolean,
  fn: () => Promise<any>,
): Promise<boolean> {
  while (retries > 0) {
    try {
      const v = await fn()
      if (cond(v, undefined)) {
        return true
      }
    } catch (e: any) {
      if (cond(undefined, e)) {
        return true
      }
    }
    await timeout(delay)
    retries--
  }
  return false
}
