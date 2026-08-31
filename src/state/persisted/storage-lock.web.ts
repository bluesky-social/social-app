import {type PersistedApi} from './types'

const PERSISTED_STORAGE_LOCK = 'bsky-persisted-storage'

export function runWithPersistedStorageLock<T>({
  operation,
}: {
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
          : new Error('Persisted storage operation failed', {cause: error}),
      )
    }
  }

  return lockManager.request(PERSISTED_STORAGE_LOCK, operation)
}
runWithPersistedStorageLock satisfies PersistedApi['runWithPersistedStorageLock']

function getLockManager(): LockManager | undefined {
  if (typeof navigator === 'undefined' || !('locks' in navigator)) {
    return undefined
  }
  const lockManager = navigator.locks
  return typeof lockManager?.request === 'function' ? lockManager : undefined
}
