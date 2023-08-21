type BundledFn<Args extends readonly unknown[], Res> = (
  ...args: Args
) => Promise<Res>

function _getPromiseKey<Args extends readonly unknown[], Res>(fn: BundledFn<Args, Res>, args: Args) {
  const name = fn.name || fn.toString();
  const argsStr = JSON.stringify(args);
  return `${name}#${argsStr}`;
}

/**
 * A helper which ensures that multiple calls to an async function
 * only produces one in-flight request at a time.
 */
export function bundleAsync<Args extends readonly unknown[], Res>(
  fn: BundledFn<Args, Res>,
): BundledFn<Args, Res> {
  const promises: { [key: string]: Promise<Res> | undefined } = {};
  return async (...args) => {
    const key = _getPromiseKey(fn, args);
    if (promises[key]) {
      return promises[key] as Promise<Res>;
    }
    promises[key] = fn(...args)
    try {
      return (await promises[key]) as Res
    } finally {
      delete promises[key];
    }
  }
}
