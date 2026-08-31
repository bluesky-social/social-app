const PERSISTED_STORAGE_LOCK = 'bsky-persisted-storage'
const SESSION_LOCK_PREFIX = 'bsky-session:'

export function runWithSessionCredentialLock<T>({
  accountDids,
  operation,
}: {
  accountDids: string[]
  operation: () => T | Promise<T>
}): Promise<T> {
  const lockManager = getLockManager()
  if (!lockManager) {
    try {
      return Promise.resolve(operation())
    } catch (error) {
      return Promise.reject(
        error instanceof Error
          ? error
          : new Error('Session credential operation failed', {cause: error}),
      )
    }
  }

  const accountLockNames = [...new Set(accountDids)]
    .sort()
    .map(did => `${SESSION_LOCK_PREFIX}${did}`)
  /* All values share one localStorage blob, so every write also takes its lock. */
  const lockNames = [PERSISTED_STORAGE_LOCK, ...accountLockNames]

  const run = (index: number): Promise<T> => {
    const lockName = lockNames[index]
    if (!lockName) return Promise.resolve(operation())
    return lockManager.request(lockName, () => run(index + 1))
  }

  return run(0)
}

function getLockManager(): LockManager | undefined {
  if (typeof navigator === 'undefined' || !('locks' in navigator)) {
    return undefined
  }
  const lockManager = navigator.locks
  return typeof lockManager?.request === 'function' ? lockManager : undefined
}
