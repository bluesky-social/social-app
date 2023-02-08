type BundledFn<Args extends readonly unknown[], Res> = (
  ...args: Args
) => Promise<Res>

/**
 * A helper which ensures that multiple calls to an async function
 * only produces one in-flight request at a time.
 */
export function bundleAsync<Args extends readonly unknown[], Res>(
  fn: BundledFn<Args, Res>,
): BundledFn<Args, Res> {
  let promise: Promise<Res> | undefined
  return async (...args) => {
    if (promise) {
      return promise
    }
    promise = fn(...args)
    try {
      return await promise
    } finally {
      promise = undefined
    }
  }
}
