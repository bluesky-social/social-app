import {type PersistedApi} from './types'

export function runWithPersistedStorageLock<T>({
  operation,
}: {
  operation: () => T | Promise<T>
}): Promise<T> {
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
runWithPersistedStorageLock satisfies PersistedApi['runWithPersistedStorageLock']
