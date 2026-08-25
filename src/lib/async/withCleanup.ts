/**
 * Runs `fn`, then `cleanup`, whether or not `fn` throws - i.e. exactly what a
 * `try`/`finally` does.
 *
 * It exists because React Compiler cannot lower a `finally` block, so any
 * component or hook containing one is skipped entirely. Where the `try` has a
 * `catch` that completes normally the cleanup can simply move below the
 * `try`/`catch`, and that is the preferred fix. This is for the cases where it
 * cannot: a `try`/`finally` with no `catch`, where the cleanup has to survive
 * the throw path too. Keeping the `try`/`finally` here, out of the compiled
 * function, preserves the semantics exactly.
 *
 * Note that `return` inside `fn` returns from `fn`, not from the caller. Only
 * use this where the `try` is the whole body of its function.
 */
export async function withCleanup<T>(
  fn: () => Promise<T>,
  cleanup: () => void,
): Promise<T> {
  try {
    return await fn()
  } finally {
    cleanup()
  }
}
