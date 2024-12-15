import {timeout} from './timeout'

export async function poll<T>(
  retries: number,
  delay: number,
  shouldExit: (
    props: {response: T; error: undefined} | {response: undefined; error: any},
  ) => boolean,
  request: () => Promise<T>,
): Promise<T | undefined> {
  while (retries > 0) {
    try {
      const v = await request()
      if (shouldExit({response: v, error: undefined})) {
        return v
      }
    } catch (e: any) {
      if (shouldExit({response: undefined, error: e})) {
        return undefined
      }
    }
    await timeout(delay)
    retries--
  }
}
