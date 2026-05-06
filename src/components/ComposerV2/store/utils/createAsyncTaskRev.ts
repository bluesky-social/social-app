/**
 * A keyed revision counter used to cancel stale async work. Callers
 * `incrementFor(key)` to bump a key's revision and capture the new value,
 * then later `isCurrentFor(key, rev)` to check whether their captured
 * revision is still the live one. If it isn't, a newer caller has
 * superseded them and they should bail.
 *
 * Example:
 *   const rev = task.incrementFor(postId)
 *   doAsyncWork().then(result => {
 *     if (!task.isCurrentFor(postId, rev)) return
 *     // ... write result to state
 *   })
 *
 * `clearFor(key)` drops the key - any later isCurrentFor call for that
 * key returns false. Right hook to call from removePost.
 * `clearAll()` drops every key - used on store destroy.
 */
export type AsyncTaskRev = {
  /** Bump the key's revision and return the new value. */
  incrementFor(key: string): number
  /** True while `rev` is still the current revision for `key`. */
  isCurrentFor(key: string, rev: number): boolean
  /** Drop the key. Future isCurrentFor calls for this key return false. */
  clearFor(key: string): void
  /** Drop every key. Future isCurrentFor calls return false. */
  clearAll(): void
}

export function createAsyncTaskRev(): AsyncTaskRev {
  const counters = new Map<string, number>()
  return {
    incrementFor(key) {
      const next = (counters.get(key) ?? 0) + 1
      counters.set(key, next)
      return next
    },
    isCurrentFor(key, rev) {
      return counters.get(key) === rev
    },
    clearFor(key) {
      counters.delete(key)
    },
    clearAll() {
      counters.clear()
    },
  }
}
