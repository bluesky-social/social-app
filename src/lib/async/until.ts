import {timeout} from './timeout'

export async function until<T>(
  retries: number,
  delay: number,
  cond: (v: T) => boolean,
  fn: () => Promise<T>,
): Promise<boolean> {
  while (retries > 0) {
    let v: T
    try {
      v = await fn()
    } catch {
      await timeout(delay)
      retries--
      continue
    }
    if (cond(v)) {
      return true
    }
    await timeout(delay)
    retries--
  }
  return false
}
